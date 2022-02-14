const ipVersion = require('is-ip')
const allCountriesData = require('countries-list') // https://www.npmjs.com/package/countries-list
const { currencyMapping } = require('./src/currencyData')

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}


async function handleRequest(request) {

  try {
    const clientIP = request.headers.get("CF-Connecting-IP")
    const clientIpType = ipVersion.isIP(clientIP)
        ? (ipVersion.isIPv4(clientIP) ? 'ipv4' : (ipVersion.isIPv6(clientIP) ? 'ipv6' : null))
        : null


    const countryCode = request.cf.country
    const continent = request.cf.continent
    const latitude = request.cf.latitude
    const longitude = request.cf.longitude
    const postalCode = request.cf.postalCode
    const region = request.cf.region
    const asn = request.cf.asn
    const isp = request.cf.asOrganization
    const regionCode = request.cf.regionCode
    const city = request.cf.city
    const isEu = Boolean(request.cf.isEUCountry)

    const countryInfo = allCountriesData.countries[countryCode]
    const capital = countryInfo.capital
    const callingCodes = countryInfo.phone.split(',')
    const currencySymbols = countryInfo.currency.split(',') // missing USN, CHE



    const currencies = []
    for (const symbol of currencySymbols) {
      const currencyFromSymbol = currencyMapping[symbol] // does this actually have all countries???
      currencies.push({
        'code': symbol,
        'name': currencyFromSymbol.name,
        'plural': capitalizeFirstLetter(currencyFromSymbol.name_plural),
        'symbol': currencyFromSymbol.symbol,
        'symbol_native': currencyFromSymbol.symbol_native,
      })
    }

    const continentName = allCountriesData.continents[continent]

    let languages = []

    const countryLanguages = countryInfo.languages
    for (const languageCode of countryLanguages) {
      let languageData = allCountriesData.languages[languageCode]
      languages.push({
        'code': languageCode,
        'name': languageData.name,
        'native': languageData.native,
      })
    }

    const timezone = request.cf.timezone

    const response = {
      'ip': clientIP,
      'type': clientIpType,
      'capital': capital,
      'calling_codes': callingCodes,
      'city': city,
      'continent_code': continent,
      'continent_name': continentName,
      'country_code': countryCode,
      'country_flag_url': '', // assets url
      'country_flag_emoji': countryInfo.emoji,
      'country_flag_emoji_unicode': countryInfo.emojiU,
      'country_name': countryInfo.name,
      'country_name_native': countryInfo.native,
      'is_eu': isEu,
      'languages': languages,
      'latitude': latitude,
      'longitude': longitude,
      'region_code': regionCode,
      'region_name': region,
      'zip': postalCode,

      'currencies': currencies,
      'time_zone': {
        'zone': timezone,
        'currency_time': (new Date()).toLocaleString([], {timeZone: timezone})
      },
      'connection': {
        'asn': asn,
        'isp': isp
      }
    }
    return new Response(JSON.stringify(response), {
      headers: {
        "content-type": "application/json;charset=UTF-8"
      }
    })
  } catch (e) {
    console.log(`error from ${request.headers.get("CF-Connecting-IP")}`, e.message, e.stack)
  }
}
