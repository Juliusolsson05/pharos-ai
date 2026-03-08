package pharos.api

import io.circe.*
import io.circe.syntax.*
import org.http4s.{Request, Uri}

/** Cursor-based pagination for list API endpoints.
  *
  * Extracts `limit` and `offset` from query params with sensible defaults.
  * Produces standardized pagination metadata in responses.
  *
  * Usage:
  *   val page = Pagination.fromRequest(req)
  *   val items = allItems.slice(page.offset, page.offset + page.limit)
  *   page.envelope("clusters", items, allItems.size)
  */
object Pagination:

  val DefaultLimit  = 50
  val MaxLimit      = 500

  final case class Page(limit: Int, offset: Int):

    /** Paginate a list in memory. */
    def apply[A](items: List[A]): List[A] =
      items.slice(offset, offset + limit)

    /** Build the standard paginated response envelope. */
    def envelope[A: Encoder](key: String, items: List[A], totalCount: Int): Json =
      Json.obj(
        "ok"   -> true.asJson,
        "data" -> Json.obj(
          key       -> items.asJson,
          "count"   -> items.size.asJson,
          "total"   -> totalCount.asJson,
          "limit"   -> limit.asJson,
          "offset"  -> offset.asJson,
          "hasMore" -> (offset + items.size < totalCount).asJson,
        ),
      )

  /** Extract pagination from request query params.
    * Defaults: limit=50, offset=0. Max limit=500.
    */
  def fromRequest[F[_]](req: Request[F]): Page =
    val params = req.uri.query.params
    val limit  = params.get("limit")
      .flatMap(_.toIntOption)
      .map(l => math.max(1, math.min(MaxLimit, l)))
      .getOrElse(DefaultLimit)
    val offset = params.get("offset")
      .flatMap(_.toIntOption)
      .map(o => math.max(0, o))
      .getOrElse(0)
    Page(limit, offset)

end Pagination
