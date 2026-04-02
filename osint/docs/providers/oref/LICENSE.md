# OREF (Israel Home Front Command Alerts) — Data License

## License

**Israeli State Copyright — no explicit open-data license.**

Unlike U.S. government works, Israeli government works are NOT automatically public domain. Under Israel's Copyright Act of 2007, State-owned works have copyright lasting 50 years.

Emergency alerts from Pikud HaOref are not in the exempt categories (which cover only statutes, regulations, Knesset protocols, and judicial decisions).

## De Facto Status

- The API (`/WarningMessages/alert/alerts.json`) is publicly accessible from Israeli IPs without authentication
- A large ecosystem of open-source projects consumes this API without documented restrictions
- The data serves a critical public safety function
- No evidence of enforcement against redistribution

## Terms of Use

OREF has a Terms of Use page at `https://www.oref.org.il/eng/articles/accessibility-terms/accessibility-terms/terms` but it returns HTTP 403 and its contents could not be verified.

## Technical Restriction

The API geo-blocks non-Israeli IP addresses. Access requires an Israeli IP or proxy.

## Source

- OREF: https://www.oref.org.il/
- Israel Copyright Act 2007: https://www.wipo.int/wipolex/en/legislation/details/11509
