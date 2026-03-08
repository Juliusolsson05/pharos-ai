package pharos

import munit.FunSuite
import pharos.api.Pagination
import io.circe.syntax.*

class PaginationSpec extends FunSuite:

  test("default page returns first 50 items") {
    val page = Pagination.Page(50, 0)
    val items = (1 to 100).toList
    val result = page(items)
    assertEquals(result.size, 50)
    assertEquals(result.head, 1)
    assertEquals(result.last, 50)
  }

  test("offset skips items") {
    val page = Pagination.Page(10, 5)
    val items = (1 to 20).toList
    val result = page(items)
    assertEquals(result.size, 10)
    assertEquals(result.head, 6)
    assertEquals(result.last, 15)
  }

  test("limit caps results") {
    val page = Pagination.Page(5, 0)
    val items = (1 to 100).toList
    assertEquals(page(items).size, 5)
  }

  test("offset beyond list returns empty") {
    val page = Pagination.Page(10, 100)
    val items = (1 to 50).toList
    assertEquals(page(items), List.empty)
  }

  test("envelope has correct structure") {
    val page = Pagination.Page(2, 1)
    val items = List("a", "b", "c", "d", "e")
    val paged = page(items)
    val json = page.envelope("items", paged, items.size)
    val data = json.hcursor.downField("data")
    assertEquals(data.downField("count").as[Int].toOption, Some(2))
    assertEquals(data.downField("total").as[Int].toOption, Some(5))
    assertEquals(data.downField("offset").as[Int].toOption, Some(1))
    assertEquals(data.downField("hasMore").as[Boolean].toOption, Some(true))
  }

  test("hasMore is false on last page") {
    val page = Pagination.Page(10, 0)
    val items = List("a", "b")
    val json = page.envelope("items", page(items), items.size)
    val hasMore = json.hcursor.downField("data").downField("hasMore").as[Boolean]
    assertEquals(hasMore.toOption, Some(false))
  }

end PaginationSpec
