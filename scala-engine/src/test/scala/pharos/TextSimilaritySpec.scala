package pharos

import munit.FunSuite
import pharos.correlation.TextSimilarity

class TextSimilaritySpec extends FunSuite:

  test("tokenize removes stop words and short tokens"):
    val tokens = TextSimilarity.tokenize("The Iranian military launched a missile strike on Israeli targets")
    assert(!tokens.contains("the"))
    assert(!tokens.contains("a"))
    assert(!tokens.contains("on"))
    assert(tokens.contains("iranian"))
    assert(tokens.contains("military"))
    assert(tokens.contains("missile"))
    assert(tokens.contains("strike"))

  test("jaccard returns 1.0 for identical sets"):
    val set = Set("iran", "missile", "strike")
    assertEqualsDouble(TextSimilarity.jaccard(set, set), 1.0, 0.001)

  test("jaccard returns 0.0 for disjoint sets"):
    val a = Set("iran", "missile")
    val b = Set("trade", "sanctions")
    assertEqualsDouble(TextSimilarity.jaccard(a, b), 0.0, 0.001)

  test("boostedJaccard scores domain keywords higher"):
    val a = Set("iran", "missile", "strike", "report")
    val b = Set("iran", "missile", "launch", "news")
    val plain   = TextSimilarity.jaccard(a, b)
    val boosted = TextSimilarity.boostedJaccard(a, b)
    assert(boosted > plain, s"boosted ($boosted) should exceed plain ($plain)")

  test("compositeSimilarity: same event from different sources scores high"):
    val reuters = "Iran launches ballistic missile strike against Israeli military bases in Negev desert"
    val alJazeera = "Iranian ballistic missiles hit Israeli military installations in southern Negev region"
    val score = TextSimilarity.compositeSimilarity(reuters, alJazeera)
    assert(score > 0.4, s"Same event should score > 0.4, got $score")

  test("compositeSimilarity: unrelated articles score low"):
    val military = "Iran launches ballistic missile strike against Israeli military bases"
    val economic = "Oil prices surge on Wall Street amid global trade concerns and tariff negotiations"
    val score = TextSimilarity.compositeSimilarity(military, economic)
    assert(score < 0.2, s"Unrelated articles should score < 0.2, got $score")

  test("extractLocations finds Middle East locations"):
    val text = "Airstrikes reported near Tehran and across the Strait of Hormuz region"
    val locations = TextSimilarity.extractLocations(text)
    assert(locations.contains("tehran"))
    assert(locations.contains("strait of hormuz"))

  test("extractActors identifies geopolitical actors"):
    val text = "IRGC forces launched attacks while IDF intercepted incoming missiles near Hezbollah positions"
    val actors = TextSimilarity.extractActors(text)
    assert(actors.contains("IRAN"))
    assert(actors.contains("ISRAEL"))
    assert(actors.contains("HEZBOLLAH"))

  test("bigram overlap captures phrase-level similarity"):
    val a = TextSimilarity.tokenize("Iranian missile strike on Israeli base")
    val b = TextSimilarity.tokenize("Iranian missile attack on Israeli position")
    val overlap = TextSimilarity.bigramOverlap(a, b)
    assert(overlap > 0.0, s"Bigram overlap should be > 0, got $overlap")

  test("extractActors returns empty for non-geopolitical text"):
    val text = "Local weather forecast shows sunny skies expected throughout the week"
    val actors = TextSimilarity.extractActors(text)
    assert(actors.isEmpty)

end TextSimilaritySpec
