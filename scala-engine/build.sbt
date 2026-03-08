val scala3Version = "3.4.1"

lazy val root = project
  .in(file("."))
  .settings(
    name         := "pharos-engine",
    version      := "0.8.0",
    scalaVersion := scala3Version,
    organization := "app.conflicts",

    // Dependency versions
    libraryDependencies ++= {
      val http4sV   = "0.23.27"
      val circeV    = "0.14.7"
      val doobieV   = "1.0.0-RC5"
      val fs2V      = "3.10.2"
      val catsV     = "3.5.4"
      val log4catsV = "2.7.0"
      val pureConfigV = "0.17.6"

      Seq(
        // Cats Effect + FS2 streaming
        "org.typelevel"         %% "cats-effect"         % catsV,
        "co.fs2"                %% "fs2-core"            % fs2V,
        "co.fs2"                %% "fs2-io"              % fs2V,

        // HTTP server (http4s + Ember)
        "org.http4s"            %% "http4s-ember-server" % http4sV,
        "org.http4s"            %% "http4s-ember-client" % http4sV,
        "org.http4s"            %% "http4s-circe"        % http4sV,
        "org.http4s"            %% "http4s-dsl"          % http4sV,

        // JSON (Circe)
        "io.circe"              %% "circe-core"          % circeV,
        "io.circe"              %% "circe-generic"       % circeV,
        "io.circe"              %% "circe-parser"        % circeV,

        // Database (Doobie + PostgreSQL)
        "org.tpolecat"          %% "doobie-core"         % doobieV,
        "org.tpolecat"          %% "doobie-hikari"       % doobieV,
        "org.tpolecat"          %% "doobie-postgres"     % doobieV,
        "org.tpolecat"          %% "doobie-postgres-circe" % doobieV,

        // Configuration
        "com.github.pureconfig" %% "pureconfig-core"     % pureConfigV,

        // Logging
        "org.typelevel"         %% "log4cats-slf4j"      % log4catsV,
        "ch.qos.logback"         % "logback-classic"     % "1.5.6",

        // XML parsing (RSS feeds)
        "org.scala-lang.modules" %% "scala-xml"          % "2.3.0",

        // Testing
        "org.scalameta"         %% "munit"               % "1.0.0"  % Test,
        "org.typelevel"         %% "munit-cats-effect"   % "2.0.0"  % Test,
        "org.tpolecat"          %% "doobie-munit"        % doobieV  % Test,
      )
    },

    // Compiler flags
    scalacOptions ++= Seq(
      "-Wunused:all",
      "-feature",
      "-deprecation",
    ),

    // Assembly settings for fat JAR
    assembly / mainClass := Some("pharos.Main"),
    assembly / assemblyMergeStrategy := {
      case PathList("META-INF", xs @ _*) => MergeStrategy.discard
      case "module-info.class"           => MergeStrategy.discard
      case x                             => MergeStrategy.first
    },

    // Test framework
    testFrameworks += new TestFramework("munit.Framework"),
  )
