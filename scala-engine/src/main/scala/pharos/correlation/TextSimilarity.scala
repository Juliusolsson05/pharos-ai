package pharos.correlation

/** Lightweight text similarity utilities for event correlation.
  *
  * Uses token-level Jaccard + TF-IDF-weighted cosine similarity
  * to determine if two intel items refer to the same real-world event.
  * No ML dependencies — fast enough for real-time correlation.
  */
object TextSimilarity:

  private val StopWords: Set[String] = Set(
    "the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
    "have", "has", "had", "do", "does", "did", "will", "would", "could",
    "should", "may", "might", "shall", "can", "need", "dare", "ought",
    "used", "to", "of", "in", "for", "on", "with", "at", "by", "from",
    "as", "into", "through", "during", "before", "after", "above", "below",
    "between", "out", "off", "over", "under", "again", "further", "then",
    "once", "here", "there", "when", "where", "why", "how", "all", "both",
    "each", "few", "more", "most", "other", "some", "such", "no", "nor",
    "not", "only", "own", "same", "so", "than", "too", "very", "just",
    "don", "now", "and", "but", "or", "if", "this", "that", "these",
    "those", "it", "its", "he", "she", "they", "we", "you", "his", "her",
    "their", "our", "your", "said", "says", "according", "also", "who",
    "which", "what", "about", "up", "one", "two", "new", "like", "time",
  )

  /** Domain-boosted keywords — these get extra weight in similarity scoring. */
  private val DomainBoostWords: Set[String] = Set(
    // Military
    "airstrike", "missile", "drone", "attack", "strike", "bombing",
    "artillery", "troops", "military", "forces", "navy", "naval",
    "warship", "fighter", "jet", "radar", "intercept", "defense",
    "offensive", "ceasefire", "casualties", "killed", "wounded",
    // Geopolitical
    "iran", "israel", "hezbollah", "hamas", "irgc", "idf",
    "pentagon", "centcom", "tehran", "jerusalem", "beirut", "gaza",
    "strait", "hormuz", "nuclear", "enrichment", "sanctions",
    // Diplomacy
    "negotiations", "summit", "resolution", "embargo", "treaty",
    "alliance", "coalition", "nato", "un", "security_council",
  )

  /** Tokenize text into normalized stems. */
  def tokenize(text: String): Vector[String] =
    text
      .toLowerCase
      .replaceAll("[^a-z0-9\\s]", " ")
      .split("\\s+")
      .filter(_.length > 2)
      .filterNot(StopWords.contains)
      .toVector

  /** Jaccard similarity between two token sets. */
  def jaccard(a: Set[String], b: Set[String]): Double =
    if a.isEmpty && b.isEmpty then 0.0
    else
      val inter = (a & b).size.toDouble
      val union = (a | b).size.toDouble
      inter / union

  /** Domain-boosted Jaccard: overlapping domain keywords count double. */
  def boostedJaccard(a: Set[String], b: Set[String]): Double =
    if a.isEmpty && b.isEmpty then 0.0
    else
      val overlap     = a & b
      val domainBoost = (overlap & DomainBoostWords).size.toDouble
      val inter       = overlap.size.toDouble + domainBoost
      val union       = (a | b).size.toDouble + domainBoost
      inter / union

  /** N-gram generation for fuzzy matching. */
  def ngrams(tokens: Vector[String], n: Int): Set[Vector[String]] =
    if tokens.size < n then Set.empty
    else tokens.sliding(n).toSet

  /** Bigram overlap coefficient — catches phrase-level similarity. */
  def bigramOverlap(a: Vector[String], b: Vector[String]): Double =
    val biA = ngrams(a, 2)
    val biB = ngrams(b, 2)
    if biA.isEmpty || biB.isEmpty then 0.0
    else (biA & biB).size.toDouble / math.min(biA.size, biB.size).toDouble

  /** Composite similarity score combining multiple signals.
    *
    * Returns 0.0 – 1.0 where:
    *   0.0 – 0.3 = unrelated
    *   0.3 – 0.6 = possibly related
    *   0.6 – 0.8 = likely same event
    *   0.8 – 1.0 = almost certainly same event
    */
  def compositeSimilarity(textA: String, textB: String): Double =
    val tokA = tokenize(textA)
    val tokB = tokenize(textB)
    val setA = tokA.toSet
    val setB = tokB.toSet

    val jac     = boostedJaccard(setA, setB)
    val bigrams = bigramOverlap(tokA, tokB)

    // Weighted combination: jaccard for coverage, bigrams for phrase matching
    (jac * 0.6) + (bigrams * 0.4)

  /** Extract location entities from text using pattern matching.
    * Returns normalized location strings for geo-correlation.
    */
  def extractLocations(text: String): Set[String] =
    val locationPatterns = List(
      // Middle East cities/regions
      "tehran", "isfahan", "shiraz", "tabriz", "mashhad", "bushehr",
      "jerusalem", "tel aviv", "haifa", "beer sheva", "negev",
      "beirut", "tyre", "sidon", "baalbek",
      "gaza", "rafah", "khan younis",
      "damascus", "aleppo", "latakia",
      "baghdad", "erbil", "basra",
      "riyadh", "jeddah", "dhahran",
      // Strategic locations
      "strait of hormuz", "persian gulf", "red sea", "gulf of oman",
      "mediterranean", "suez canal", "bab el mandeb",
      "golan heights", "west bank", "sinai",
      "natanz", "fordow", "dimona", "parchin",
    )
    val lower = text.toLowerCase
    locationPatterns.filter(lower.contains).toSet

  /** Extract named actors from text. */
  def extractActors(text: String): Set[String] =
    val actorPatterns = List(
      "iran"      -> "IRAN",
      "irgc"      -> "IRAN",
      "tehran"    -> "IRAN",
      "israel"    -> "ISRAEL",
      "idf"       -> "ISRAEL",
      "mossad"    -> "ISRAEL",
      "hezbollah" -> "HEZBOLLAH",
      "hamas"     -> "HAMAS",
      "houthi"    -> "HOUTHIS",
      "pentagon"  -> "USA",
      "centcom"   -> "USA",
      "us forces" -> "USA",
      "american"  -> "USA",
      "nato"      -> "NATO",
      "russia"    -> "RUSSIA",
      "china"     -> "CHINA",
    )
    val lower = text.toLowerCase
    actorPatterns.collect { case (pattern, actor) if lower.contains(pattern) => actor }.toSet
end TextSimilarity
