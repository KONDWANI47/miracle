// Initialize the map
function initMap() {
  // Lilongwe, Malawi coordinates
  const schoolLocation = { lat: -13.9626, lng: 33.7741 }

  // Create the map
  const map = new google.maps.Map(document.getElementById("schoolMap"), {
    zoom: 15,
    center: schoolLocation,
    styles: [
      {
        featureType: "all",
        elementType: "geometry",
        stylers: [{ color: "#f5f5f5" }],
      },
      {
        featureType: "water",
        elementType: "geometry",
        stylers: [{ color: "#c9c9c9" }],
      },
      {
        featureType: "water",
        elementType: "labels.text.fill",
        stylers: [{ color: "#9e9e9e" }],
      },
    ],
  })

  // Add a marker for the school
  const marker = new google.maps.Marker({
    position: schoolLocation,
    map: map,
    title: "MIRACLE ECD",
    animation: google.maps.Animation.DROP,
  })

  // Add an info window
  const infoWindow = new google.maps.InfoWindow({
    content: `
      <div style="padding: 10px;">
        <h3 style="margin: 0 0 5px 0;">MIRACLE ECD</h3>
        <p style="margin: 0;">Area 25, Sector 5<br>Lilongwe, Malawi</p>
        <p style="margin: 5px 0 0 0;">
          <i class="fas fa-phone"></i> +265 992 260 985<br>
          <i class="fas fa-envelope"></i> cupicsart@gmail.com
        </p>
      </div>
    `,
  })

  // Add click listener to marker
  marker.addListener("click", () => {
    infoWindow.open(map, marker)
  })
}

// Handle any errors in map loading
function handleMapError() {
  const mapDiv = document.getElementById("schoolMap")
  if (mapDiv) {
    mapDiv.innerHTML = `
      <div style="padding: 20px; text-align: center; color: #666;">
        <i class="fas fa-map-marked-alt" style="font-size: 48px; margin-bottom: 10px;"></i>
        <p>Unable to load map. Please check your internet connection.</p>
      </div>
    `
  }
}

// Add error handler for map loading
window.gm_authFailure = handleMapError

// Initialize map when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  // Check if we're on the admin page and the map section is visible
  const mapSection = document.getElementById("schoolMap")
  if (mapSection) {
    // If Google Maps API is not loaded, show fallback
    if (typeof google === "undefined") {
      handleMapError()
    } else {
      initMap()
    }
  }
})
