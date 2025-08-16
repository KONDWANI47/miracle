// Google Maps functionality for the admin panel
let map
let marker
let directionsService
let directionsRenderer
const google = window.google // Declare the google variable

// School location coordinates (Area 25, Sector 5, Lilongwe, Malawi)
const schoolLocation = {
  lat: -13.9626,
  lng: 33.7741,
}

function initGoogleMap() {
  // Initialize the map
  map = new google.maps.Map(document.getElementById("schoolMap"), {
    zoom: 15,
    center: schoolLocation,
    mapTypeId: google.maps.MapTypeId.ROADMAP,
    styles: [
      {
        featureType: "poi.school",
        elementType: "geometry",
        stylers: [{ color: "#4caf50" }],
      },
    ],
  })

  // Create a marker for the school
  marker = new google.maps.Marker({
    position: schoolLocation,
    map: map,
    title: "MIRACLE ECD - Early Childhood Development Centre",
    icon: {
      url:
        "data:image/svg+xml;charset=UTF-8," +
        encodeURIComponent(`
        <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
          <circle cx="20" cy="20" r="18" fill="#4caf50" stroke="#fff" stroke-width="2"/>
          <text x="20" y="26" text-anchor="middle" fill="white" font-family="Arial" font-size="12" font-weight="bold">ECD</text>
        </svg>
      `),
      scaledSize: new google.maps.Size(40, 40),
      anchor: new google.maps.Point(20, 20),
    },
  })

  // Create info window
  const infoWindow = new google.maps.InfoWindow({
    content: `
      <div style="padding: 10px; max-width: 300px;">
        <h3 style="color: #4caf50; margin: 0 0 10px 0;">MIRACLE ECD</h3>
        <p style="margin: 5px 0;"><strong>Address:</strong> Area 25, Sector 5, Lilongwe, Malawi</p>
        <p style="margin: 5px 0;"><strong>Phone:</strong> +265 992 260 985</p>
        <p style="margin: 5px 0;"><strong>Email:</strong> <a href="mailto:cupicsart@gmail.com">cupicsart@gmail.com</a></p>
        <p style="margin: 5px 0;"><strong>Hours:</strong></p>
        <p style="margin: 2px 0; font-size: 0.9em;">Mon-Fri: 7:00 AM - 5:00 PM</p>
        <p style="margin: 2px 0; font-size: 0.9em;">Sat: 8:00 AM - 12:00 PM</p>
        <div style="margin-top: 10px;">
          <button onclick="getDirections()" style="background: #4caf50; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer; margin-right: 5px;">Get Directions</button>
          <button onclick="toggleTraffic()" style="background: #2196f3; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer;">Toggle Traffic</button>
        </div>
      </div>
    `,
  })

  // Show info window when marker is clicked
  marker.addListener("click", () => {
    infoWindow.open(map, marker)
  })

  // Initialize directions service
  directionsService = new google.maps.DirectionsService()
  directionsRenderer = new google.maps.DirectionsRenderer({
    draggable: true,
    panel: null,
  })
  directionsRenderer.setMap(map)

  // Traffic layer
  const trafficLayer = new google.maps.TrafficLayer()
  let trafficVisible = false

  // Global functions for info window buttons
  window.getDirections = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          }

          const request = {
            origin: userLocation,
            destination: schoolLocation,
            travelMode: google.maps.TravelMode.DRIVING,
            unitSystem: google.maps.UnitSystem.METRIC,
            avoidHighways: false,
            avoidTolls: false,
          }

          directionsService.route(request, (result, status) => {
            if (status === "OK") {
              directionsRenderer.setDirections(result)

              // Show route information
              const route = result.routes[0]
              const leg = route.legs[0]

              const routeInfo = `
                <div style="background: #f0f0f0; padding: 10px; margin: 10px 0; border-radius: 5px;">
                  <h4 style="margin: 0 0 5px 0; color: #333;">Route Information</h4>
                  <p style="margin: 2px 0;"><strong>Distance:</strong> ${leg.distance.text}</p>
                  <p style="margin: 2px 0;"><strong>Duration:</strong> ${leg.duration.text}</p>
                  <p style="margin: 2px 0;"><strong>From:</strong> ${leg.start_address}</p>
                  <p style="margin: 2px 0;"><strong>To:</strong> ${leg.end_address}</p>
                </div>
              `

              // Update info window with route info
              infoWindow.setContent(infoWindow.getContent() + routeInfo)
            } else {
              alert("Directions request failed due to " + status)
            }
          })
        },
        (error) => {
          let errorMessage = "Error getting your location: "
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage += "Location access denied by user."
              break
            case error.POSITION_UNAVAILABLE:
              errorMessage += "Location information is unavailable."
              break
            case error.TIMEOUT:
              errorMessage += "Location request timed out."
              break
            default:
              errorMessage += "An unknown error occurred."
              break
          }
          alert(errorMessage + " Please enter your location manually or enable location services.")

          // Fallback: Ask user to enter their location
          const userAddress = prompt("Please enter your address or location:")
          if (userAddress) {
            const geocoder = new google.maps.Geocoder()
            geocoder.geocode({ address: userAddress }, (results, status) => {
              if (status === "OK") {
                const userLocation = results[0].geometry.location

                const request = {
                  origin: userLocation,
                  destination: schoolLocation,
                  travelMode: google.maps.TravelMode.DRIVING,
                  unitSystem: google.maps.UnitSystem.METRIC,
                }

                directionsService.route(request, (result, status) => {
                  if (status === "OK") {
                    directionsRenderer.setDirections(result)
                  } else {
                    alert("Could not calculate directions: " + status)
                  }
                })
              } else {
                alert("Could not find the address you entered: " + status)
              }
            })
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000,
        },
      )
    } else {
      alert("Geolocation is not supported by this browser.")
    }
  }

  window.toggleTraffic = () => {
    if (trafficVisible) {
      trafficLayer.setMap(null)
      trafficVisible = false
    } else {
      trafficLayer.setMap(map)
      trafficVisible = true
    }
  }

  // Add some nearby landmarks for context
  const landmarks = [
    {
      position: { lat: -13.958, lng: 33.772 },
      title: "Area 25 Market",
      icon: "🏪",
    },
    {
      position: { lat: -13.965, lng: 33.78 },
      title: "Area 25 Health Center",
      icon: "🏥",
    },
    {
      position: { lat: -13.96, lng: 33.768 },
      title: "Area 25 Primary School",
      icon: "🏫",
    },
  ]

  landmarks.forEach((landmark) => {
    const landmarkMarker = new google.maps.Marker({
      position: landmark.position,
      map: map,
      title: landmark.title,
      icon: {
        url:
          "data:image/svg+xml;charset=UTF-8," +
          encodeURIComponent(`
          <svg width="30" height="30" viewBox="0 0 30 30" xmlns="http://www.w3.org/2000/svg">
            <circle cx="15" cy="15" r="12" fill="#2196f3" stroke="#fff" stroke-width="2"/>
            <text x="15" y="20" text-anchor="middle" fill="white" font-family="Arial" font-size="16">${landmark.icon}</text>
          </svg>
        `),
        scaledSize: new google.maps.Size(30, 30),
        anchor: new google.maps.Point(15, 15),
      },
    })

    const landmarkInfoWindow = new google.maps.InfoWindow({
      content: `
        <div style="padding: 8px;">
          <h4 style="margin: 0; color: #2196f3;">${landmark.title}</h4>
          <p style="margin: 5px 0 0 0; font-size: 0.9em;">Nearby landmark</p>
        </div>
      `,
    })

    landmarkMarker.addListener("click", () => {
      landmarkInfoWindow.open(map, landmarkMarker)
    })
  })

  // Add map controls
  const controlDiv = document.createElement("div")
  controlDiv.style.margin = "10px"
  controlDiv.style.textAlign = "center"

  const controlUI = document.createElement("div")
  controlUI.style.backgroundColor = "#fff"
  controlUI.style.border = "2px solid #fff"
  controlUI.style.borderRadius = "3px"
  controlUI.style.boxShadow = "0 2px 6px rgba(0,0,0,.3)"
  controlUI.style.cursor = "pointer"
  controlUI.style.marginBottom = "22px"
  controlUI.style.textAlign = "center"
  controlUI.title = "Click to center map on MIRACLE ECD"
  controlDiv.appendChild(controlUI)

  const controlText = document.createElement("div")
  controlText.style.color = "rgb(25,25,25)"
  controlText.style.fontFamily = "Roboto,Arial,sans-serif"
  controlText.style.fontSize = "16px"
  controlText.style.lineHeight = "38px"
  controlText.style.paddingLeft = "5px"
  controlText.style.paddingRight = "5px"
  controlText.innerHTML = "🏠 Center on School"
  controlUI.appendChild(controlText)

  controlUI.addEventListener("click", () => {
    map.setCenter(schoolLocation)
    map.setZoom(15)
    infoWindow.open(map, marker)
  })

  map.controls[google.maps.ControlPosition.TOP_CENTER].push(controlDiv)

  // Auto-open info window after a short delay
  setTimeout(() => {
    infoWindow.open(map, marker)
  }, 1000)
}

// Initialize map when the admin panel loads the map section
window.initGoogleMap = initGoogleMap

// Handle map resize when section becomes visible
const mapSection = document.getElementById("map-section")
if (mapSection) {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === "attributes" && mutation.attributeName === "class") {
        if (mapSection.classList.contains("active") && map) {
          // Trigger map resize
          setTimeout(() => {
            google.maps.event.trigger(map, "resize")
            map.setCenter(schoolLocation)
          }, 100)
        }
      }
    })
  })

  observer.observe(mapSection, {
    attributes: true,
    attributeFilter: ["class"],
  })
}

// Error handling for Google Maps API
window.gm_authFailure = () => {
  const mapElement = document.getElementById("schoolMap")
  if (mapElement) {
    mapElement.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; height: 100%; background: #f5f5f5; color: #666; text-align: center; padding: 20px;">
        <div>
          <i class="fas fa-map-marked-alt" style="font-size: 48px; margin-bottom: 15px; color: #ccc;"></i>
          <h3>Map Unavailable</h3>
          <p>Google Maps API key is required to display the map.</p>
          <p style="font-size: 0.9em; margin-top: 15px;">
            <strong>School Location:</strong><br>
            Area 25, Sector 5<br>
            Lilongwe, Malawi<br>
            Phone: +265 992 260 985
          </p>
        </div>
      </div>
    `
  }
}
