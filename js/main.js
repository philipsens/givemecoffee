const MAPBOX_API_KEY =
  'pk.eyJ1IjoicGhpbGlwc2VuIiwiYSI6ImNrM2cxbDZzMDBhMmwzaHQ2YnU1b3czcGgifQ.-TdTIZkmidBESNyHyDXNkA'

const prices = {
  cheap: '€',
  normal: '€€',
  expencive: '€€€',
  veryExpencive: '€€€€',
}

const map = L.map('map')
const coffeeMarkers = L.markerClusterGroup({
  maxClusterRadius: 50,
  polygonOptions: {
    color: '#795548',
    fillOpacity: 0.5,
  },
  iconCreateFunction: function(cluster) {
    return L.divIcon({
      className: '',
      html: `<div class="marker-cluster ${getSizeByClusterCount(
        cluster.getChildCount(),
      )}">${cluster.getChildCount()}</div>`,
    })
  },
})

const radiusLayer = L.layerGroup().addTo(map)

let locations
let position

const getSizeByClusterCount = count => {
  if (count >= 2 && count <= 5) {
    return 'marker-cluster--small'
  }
  if (count >= 6 && count <= 10) {
    return 'marker-cluster--medium'
  }
  if (count >= 11 && count <= 50) {
    return 'marker-cluster--large'
  }
}

const initializeApp = () => {
  addTilesToMap()
  initializeMap()
  setRadiusLegend()
}

const addTilesToMap = () =>
  L.tileLayer(
    'https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}',
    {
      attribution:
        'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
      maxZoom: 20,
      id: 'mapbox/streets-v11',
      accessToken: MAPBOX_API_KEY,
    },
  ).addTo(map)

const initializeMap = async () => {
  position = await getPosition()

  setMapView()

  locations = await getCoffeeLocations()

  createLayers()
}

const getPosition = () =>
  new Promise((res, rej) => {
    navigator.geolocation.getCurrentPosition(res, rej)
  }).catch(err => {
    alert(
      `Geolocation error: ${err.message}\nReturning fixed location: Le Carrefour, Leiden`,
    )
    return {
      coords: {
        latitude: 52.1689835231739,
        longitude: 4.484438896179142,
      },
    }
  })

const setMapView = () =>
  map.setView([position.coords.latitude, position.coords.longitude], 16)

const getCoffeeLocations = () =>
  fetch(
    `yelp-api.php?term=coffee&latitude=${position.coords.latitude}&longitude=${
      position.coords.longitude
    }&radius=${radius()}`,
  ).then(response => response.json())

const radius = () => document.querySelector('#radius').value

const createLayers = () => {
  createRadiusMarker()
  createUserMarker()
  createCoffeeMarkers()
  map.addLayer(coffeeMarkers)
}

const createRadiusMarker = () => {
  radiusLayer.clearLayers()

  marker = L.circle([position.coords.latitude, position.coords.longitude], {
    color: '#03a9f4',
    fillOpacity: 0,
    radius: radius(),
  })

  radiusLayer.addLayer(marker)
}

const createUserMarker = () => {
  L.marker([position.coords.latitude, position.coords.longitude], {
    riseOnHover: true,
    icon: L.divIcon({
      className: '',
      html: `<div class="marker-scale"><div class="marker marker--user"></div>`,
      iconSize: [40, 40],
      iconAnchor: [20, 40],
    }),
  })
    .bindPopup('You are here')
    .addTo(map)
}

const createCoffeeMarkers = () => {
  coffeeMarkers.clearLayers()

  locations.businesses.filter(matchSearchCriteria).map(location => {
    marker = L.marker(
      [location.coordinates.latitude, location.coordinates.longitude],
      {
        riseOnHover: true,
        icon: L.divIcon({
          className: '',
          html: `<div class="marker-scale"><div class="marker ${getColorForPrice(
            location.price,
          )} ${getBorderColorIfClosed(
            location.is_closed,
          )}"></div><div class="marker-distance ${getColorForPrice(
            location.price,
          )}">${location.distance.toFixed()}m</div></div>`,
          iconSize: [location.rating * 10, location.rating * 10],
          iconAnchor: [location.rating * 5, location.rating * 10],
        }),
      },
    )
      .bindPopup(location.name)
      .on('click', () => leadMarkerInfo(location))

    coffeeMarkers.addLayer(marker)
  })
}

const matchSearchCriteria = location =>
  ratingIsHigherThanCriteria(location.rating) &&
  priceIsBetweenCriteria(location.price)

const ratingIsHigherThanCriteria = rating =>
  rating >= document.querySelector('#minRating').value

const priceIsBetweenCriteria = price =>
  price
    ? price.length >= document.querySelector('#minPrice').value &&
      price.length <= document.querySelector('#maxPrice').value
    : true

const getColorForPrice = price => {
  switch (price) {
    case prices.cheap:
      return 'marker--green'
    case prices.normal:
      return 'marker--yellow'
    case prices.expencive:
      return 'marker--orange'
    case prices.veryExpencive:
      return 'marker--red'
    default:
      return ''
  }
}

const getBorderColorIfClosed = isClosed => (isClosed ? 'marker--closed' : '')

const leadMarkerInfo = info => {
  document.querySelector('#locationInfo').innerHTML = `
    <a class="sidebar__body__item__content__title" href="${info.url}">${info.name}</a>
    <div class="sidebar__body__item__content__image"><img src="${info.image_url}"/></div>
    <div class="sidebar__body__item__content__text">${info.location.display_address}</div>
    <a class="button" href="https://www.google.com/maps/dir/${position.coords.latitude},${position.coords.longitude}/${info.name}, ${info.location.display_address}">
        Get directions on Google Maps
    </a>`
}

const setRadiusLegend = () =>
  (document.querySelector('#radius-legend').innerHTML = radius() / 1000 + 'km')

document
  .querySelectorAll('.coffee-filter')
  .forEach(range => range.addEventListener('change', createCoffeeMarkers))

const updateRadius = async () => {
  locations = await getCoffeeLocations()
  createRadiusMarker()
  createCoffeeMarkers()
  setRadiusLegend()
}

document.querySelector('#radius').addEventListener('change', updateRadius)

initializeApp()
