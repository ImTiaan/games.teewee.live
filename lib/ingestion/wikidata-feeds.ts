import { WikidataSource } from './sources/wikidata';

export const WIKIDATA_FEEDS = [
  new WikidataSource(
    'wiki-city',
    'Guess the City',
    'guess-the-city',
    `SELECT DISTINCT ?item ?itemLabel ?image WHERE {
      ?item wdt:P31/wdt:P279* wd:Q515; wdt:P625 ?loc; wdt:P18 ?image; wdt:P1082 ?pop.
      FILTER(?pop > 500000)
      SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en". }
    } LIMIT 600`,
    'What city is shown in this image?'
  ),
  new WikidataSource(
    'wiki-landmark',
    'Guess the Landmark',
    'guess-the-landmark',
    `SELECT DISTINCT ?item ?itemLabel ?image WHERE {
      ?item wdt:P31/wdt:P279* wd:Q570116; wdt:P18 ?image.
      SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en". }
    } LIMIT 600`,
    'Can you identify this landmark?'
  ),
  new WikidataSource(
    'wiki-art-era',
    'Guess the Art Era',
    'guess-the-era',
    `SELECT ?item (?movementLabel as ?itemLabel) ?image WHERE {
      ?item wdt:P31 wd:Q3305213; wdt:P135 ?movement; wdt:P18 ?image.
      ?movement rdfs:label ?movementLabel.
      FILTER(LANG(?movementLabel) = "en")
    } LIMIT 600`,
    'Which art movement does this painting belong to?'
  ),
  new WikidataSource(
    'wiki-food-country',
    'Guess the Country (Food)',
    'guess-the-country',
    `SELECT ?item (?countryLabel as ?itemLabel) ?image WHERE {
      ?item wdt:P31/wdt:P279* wd:Q2095; wdt:P495 ?country; wdt:P18 ?image.
      ?country rdfs:label ?countryLabel.
      FILTER(LANG(?countryLabel) = "en")
    } LIMIT 600`,
    'Which country does this dish originate from?'
  )
];
