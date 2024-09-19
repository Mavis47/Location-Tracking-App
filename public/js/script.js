const socket = io();

if (navigator.geolocation) {
    navigator.geolocation.watchPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            socket.emit("send-location", { latitude, longitude }); // sending to backend
        },
        (error) => {
            console.error(error);
        },
        {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0,
        }
    );
}

const map = L.map("map").setView([0, 0], 10);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "Manish Vishwakarma",
}).addTo(map);

const markers = {};
let apiEndPoint = "https://api.opencagedata.com/geocode/v1/json";
let apikey = "f09f8dbdd74f4abe94dcbdd01e58a028";
let userHasInteracted = false; // Track user interactions

// Stop centering map after the user starts interacting
map.on("zoomstart", () => {
    userHasInteracted = true;
});
map.on("dragstart", () => {
    userHasInteracted = true;
});

// Function to fetch address from OpenCage API
async function getAddressFromCoords(lat, lan) {
    const query = `${lat},${lan}`;
    let apiurl = `${apiEndPoint}?key=${apikey}&q=${query}&pretty=1`;

    try {
        const response = await fetch(apiurl);
        const data = await response.json();
        if (data.results && data.results.length > 0) {
            return data.results[0].formatted; // Return the formatted address
        } else {
            return "Address not found";
        }
    } catch (error) {
        console.error(error);
        return "Error fetching address";
    }
}

socket.on("receive-location", async (data) => {
    const { id, latitude, longitude } = data;

    if (!userHasInteracted) {
        map.setView([latitude, longitude], 10); 
    }

    const address = await getAddressFromCoords(latitude, longitude);
    console.log(address);

    if (markers[id]) {
        markers[id].setLatLng([latitude, longitude]).bindPopup(address).openPopup();
    } else {
        markers[id] = L.marker([latitude, longitude]).addTo(map).bindPopup(address).openPopup();
    }
});

socket.on("user-disconnected", (id) => {
    if (markers[id]) {
        map.removeLayer(markers[id]);
        delete markers[id];
    }
});
