const API = "/api";

let services = [];
let complaints = [];

let complaintChart = null;
let serviceChart = null;
let map = null;
let mapMarkers = [];


// ===============================
// API REQUEST FUNCTION
// ===============================

async function apiRequest(url, options = {}) {
    try {
        const response = await fetch(API + url, {
            ...options,
            headers: {
                "Content-Type": "application/json",
                ...(options.headers || {})
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Something went wrong");
        }

        return data;

    } catch (error) {
        showToast(error.message);
        throw error;
    }
}


// ===============================
// NOTIFICATION
// ===============================

function showToast(message) {

    let toast = document.getElementById("toast");

    // Create notification if it does not exist
    if (!toast) {
        toast = document.createElement("div");
        toast.id = "toast";
        document.body.appendChild(toast);
    }

    toast.textContent = message;

    // Notification styling
    toast.style.position = "fixed";
    toast.style.top = "25px";
    toast.style.right = "25px";
    toast.style.background = "#16a36a";
    toast.style.color = "white";
    toast.style.padding = "15px 25px";
    toast.style.borderRadius = "10px";
    toast.style.fontSize = "14px";
    toast.style.fontWeight = "600";
    toast.style.zIndex = "99999";
    toast.style.boxShadow = "0 5px 20px rgba(0,0,0,0.2)";
    toast.style.display = "block";

    clearTimeout(window.toastTimer);

    window.toastTimer = setTimeout(() => {
        toast.style.display = "none";
    }, 3000);
}

// ===============================
// PAGE NAVIGATION
// ===============================

function showPage(pageName) {

    document.querySelectorAll(".page").forEach(page => {
        page.classList.remove("active");
    });

    document.getElementById(pageName).classList.add("active");

    document.querySelectorAll(".nav-link").forEach(button => {
        button.classList.toggle(
            "active",
            button.dataset.page === pageName
        );
    });

    const titles = {
        dashboard: "Dashboard",
        services: "City Services",
        complaints: "Complaints",
        map: "City Map"
    };

    document.getElementById("pageTitle").textContent =
        titles[pageName];

    if (pageName === "dashboard") {
        loadDashboard();
    }

    if (pageName === "services") {
        loadServices();
    }

    if (pageName === "complaints") {
        loadComplaints();
    }

    if (pageName === "map") {
        setTimeout(() => {
            initializeMap();
            loadMapMarkers();
        }, 100);
    }
}

document.querySelectorAll(".nav-link").forEach(button => {
    button.addEventListener("click", () => {
        showPage(button.dataset.page);
    });
});


// ===============================
// MODAL FUNCTIONS
// ===============================

function closeModal(id) {
    document.getElementById(id).classList.remove("show");
}

function openServiceModal() {
    document.getElementById("serviceForm").reset();

    document.getElementById("serviceId").value = "";
    document.getElementById("serviceModalTitle").textContent =
        "Add City Service";

    document.getElementById("serviceModal").classList.add("show");
}

function openComplaintModal() {
    document.getElementById("complaintForm").reset();

    document.getElementById("complaintModal").classList.add("show");
}


// ===============================
// LOAD SERVICES
// ===============================

async function loadServices() {

    try {
        services = await apiRequest("/services");
        renderServices();
        updateDashboardCounts();

    } catch (error) {
        console.error(error);
    }
}


function renderServices() {

    const table = document.getElementById("serviceTable");

    if (services.length === 0) {
        table.innerHTML =
            `<tr><td colspan="5">No services found. Add your first service.</td></tr>`;
        return;
    }

    table.innerHTML = services.map(service => `
        <tr>
            <td><strong>${escapeHTML(service.name)}</strong></td>
            <td>${escapeHTML(service.category)}</td>
            <td>${escapeHTML(service.location)}</td>

            <td>
                <span class="status ${escapeHTML(service.status)}">
                    ${escapeHTML(service.status)}
                </span>
            </td>

            <td>
                <button class="action-btn"
                    onclick="editService('${service._id}')">
                    <i class="fa-solid fa-pen"></i>
                </button>

                <button class="action-btn delete-btn"
                    onclick="deleteService('${service._id}')">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join("");
}


// ===============================
// ADD OR UPDATE SERVICE
// ===============================

document.getElementById("serviceForm").addEventListener(
    "submit",
    async function(event) {

        event.preventDefault();

        const id = document.getElementById("serviceId").value;

        const serviceData = {
            name: document.getElementById("serviceName").value.trim(),
            category: document.getElementById("serviceCategory").value,
            location: document.getElementById("serviceLocation").value.trim(),
            status: document.getElementById("serviceStatus").value,
            description: document.getElementById("serviceDescription").value.trim()
        };

        try {

            if (id) {
                await apiRequest(`/services/${id}`, {
                    method: "PUT",
                    body: JSON.stringify(serviceData)
                });

                showToast("Service updated successfully!");

            } else {
                await apiRequest("/services", {
                    method: "POST",
                    body: JSON.stringify(serviceData)
                });

                showToast("Service added successfully!");
            }

            closeModal("serviceModal");

            await loadServices();
            await loadDashboard();

        } catch (error) {
            console.error(error);
        }
    }
);


// ===============================
// EDIT SERVICE
// ===============================

function editService(id) {

    const service = services.find(item => item._id === id);

    if (!service) return;

    document.getElementById("serviceId").value = service._id;
    document.getElementById("serviceName").value = service.name;
    document.getElementById("serviceCategory").value = service.category;
    document.getElementById("serviceLocation").value = service.location;
    document.getElementById("serviceStatus").value = service.status;
    document.getElementById("serviceDescription").value =
        service.description || "";

    document.getElementById("serviceModalTitle").textContent =
        "Edit City Service";

    document.getElementById("serviceModal").classList.add("show");
}


// ===============================
// DELETE SERVICE
// ===============================

async function deleteService(id) {

    if (!confirm("Are you sure you want to delete this service?")) {
        return;
    }

    try {

        await apiRequest(`/services/${id}`, {
            method: "DELETE"
        });

        showToast("Service deleted successfully!");

        await loadServices();
        await loadDashboard();

        if (map) loadMapMarkers();

    } catch (error) {
        console.error(error);
    }
}


// ===============================
// LOAD COMPLAINTS
// ===============================

async function loadComplaints() {

    try {

        complaints = await apiRequest("/complaints");

        renderComplaints();
        updateDashboardCounts();

    } catch (error) {
        console.error(error);
    }
}


function renderComplaints() {

    const table = document.getElementById("complaintTable");

    if (complaints.length === 0) {
        table.innerHTML =
            `<tr><td colspan="6">No complaints registered yet.</td></tr>`;
        return;
    }

    table.innerHTML = complaints.map(complaint => `
        <tr>
            <td><strong>${escapeHTML(complaint.citizenName)}</strong></td>
            <td>${escapeHTML(complaint.title)}</td>
            <td>${escapeHTML(complaint.category)}</td>
            <td>${escapeHTML(complaint.location)}</td>

            <td>
                <select class="status-select"
                    onchange="updateComplaintStatus('${complaint._id}', this.value)">

                    ${["Pending", "In Progress", "Resolved"].map(status => `
                        <option value="${status}"
                            ${complaint.status === status ? "selected" : ""}>
                            ${status}
                        </option>
                    `).join("")}

                </select>
            </td>

            <td>
                <button class="action-btn delete-btn"
                    onclick="deleteComplaint('${complaint._id}')">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join("");
}


// ===============================
// REGISTER COMPLAINT
// ===============================

document.getElementById("complaintForm").addEventListener(
    "submit",
    async function(event) {

        event.preventDefault();

        const complaintData = {
            citizenName: document.getElementById("citizenName").value.trim(),
            title: document.getElementById("complaintTitle").value.trim(),
            category: document.getElementById("complaintCategory").value,
            location: document.getElementById("complaintLocation").value.trim(),
            description: document.getElementById("complaintDescription").value.trim()
        };

        try {

            await apiRequest("/complaints", {
                method: "POST",
                body: JSON.stringify(complaintData)
            });

            closeModal("complaintModal");

            showToast("Complaint registered successfully!");

            await loadComplaints();
            await loadDashboard();

        } catch (error) {
            console.error(error);
        }
    }
);


// ===============================
// UPDATE COMPLAINT STATUS
// ===============================

async function updateComplaintStatus(id, status) {

    try {

        await apiRequest(`/complaints/${id}`, {
            method: "PATCH",
            body: JSON.stringify({ status })
        });

        showToast("Complaint status updated!");

        await loadComplaints();
        await loadDashboard();

    } catch (error) {
        console.error(error);
    }
}


// ===============================
// DELETE COMPLAINT
// ===============================

async function deleteComplaint(id) {

    if (!confirm("Delete this complaint permanently?")) {
        return;
    }

    try {

        await apiRequest(`/complaints/${id}`, {
            method: "DELETE"
        });

        showToast("Complaint deleted!");

        await loadComplaints();
        await loadDashboard();

    } catch (error) {
        console.error(error);
    }
}


// ===============================
// DASHBOARD
// ===============================

async function loadDashboard() {

    try {

        const [stats, serviceData, complaintData] =
            await Promise.all([
                apiRequest("/dashboard"),
                apiRequest("/services"),
                apiRequest("/complaints")
            ]);

        services = serviceData;
        complaints = complaintData;

        document.getElementById("totalServices").textContent =
            stats.totalServices;

        document.getElementById("activeServices").textContent =
            stats.activeServices;

        document.getElementById("totalComplaints").textContent =
            stats.totalComplaints;

        const pending = stats.complaintStats.find(
            item => item._id === "Pending"
        );

        document.getElementById("pendingComplaints").textContent =
            pending ? pending.count : 0;

        renderRecentComplaints();
        updateCharts(stats);

    } catch (error) {
        console.error(error);
    }
}


function updateDashboardCounts() {

    document.getElementById("totalServices").textContent =
        services.length;

    document.getElementById("activeServices").textContent =
        services.filter(s => s.status === "Active").length;

    document.getElementById("totalComplaints").textContent =
        complaints.length;

    document.getElementById("pendingComplaints").textContent =
        complaints.filter(c => c.status === "Pending").length;
}


function renderRecentComplaints() {

    const table = document.getElementById("recentComplaints");

    const recent = [...complaints].slice(0, 5);

    if (!recent.length) {
        table.innerHTML =
            `<tr><td colspan="4">No complaints available.</td></tr>`;
        return;
    }

    table.innerHTML = recent.map(c => `
        <tr>
            <td>${escapeHTML(c.citizenName)}</td>
            <td>${escapeHTML(c.title)}</td>
            <td>${escapeHTML(c.category)}</td>
            <td>
                <span class="status ${escapeHTML(c.status)}">
                    ${escapeHTML(c.status)}
                </span>
            </td>
        </tr>
    `).join("");
}


// ===============================
// CHARTS
// ===============================

function updateCharts(stats) {

    const statuses = ["Pending", "In Progress", "Resolved"];

    const complaintCounts = statuses.map(status => {
        const item = stats.complaintStats.find(x => x._id === status);
        return item ? item.count : 0;
    });

    const complaintCanvas =
        document.getElementById("complaintChart");

    if (complaintChart) complaintChart.destroy();

    complaintChart = new Chart(complaintCanvas, {
        type: "doughnut",

        data: {
            labels: statuses,
            datasets: [{
                data: complaintCounts,
                backgroundColor: [
                    "#f0a33a",
                    "#6688ed",
                    "#28bd8c"
                ],
                borderWidth: 0
            }]
        },

        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: "bottom"
                }
            }
        }
    });


    const categories = {};

    services.forEach(service => {
        categories[service.category] =
            (categories[service.category] || 0) + 1;
    });

    const serviceCanvas =
        document.getElementById("serviceChart");

    if (serviceChart) serviceChart.destroy();

    serviceChart = new Chart(serviceCanvas, {
        type: "bar",

        data: {
            labels: Object.keys(categories),
            datasets: [{
                label: "Number of Services",
                data: Object.values(categories),
                backgroundColor: "#756cff",
                borderRadius: 6
            }]
        },

        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0
                    }
                }
            }
        }
    });
}


// ===============================
// SEARCH
// ===============================

document.getElementById("serviceSearch").addEventListener(
    "input",
    function() {

        const value = this.value.toLowerCase();

        document.querySelectorAll("#serviceTable tr").forEach(row => {
            row.style.display =
                row.textContent.toLowerCase().includes(value)
                    ? ""
                    : "none";
        });
    }
);


document.getElementById("complaintSearch").addEventListener(
    "input",
    function() {

        const value = this.value.toLowerCase();

        document.querySelectorAll("#complaintTable tr").forEach(row => {
            row.style.display =
                row.textContent.toLowerCase().includes(value)
                    ? ""
                    : "none";
        });
    }
);


// ===============================
// CITY MAP
// ===============================

function initializeMap() {

    if (map) {
        map.invalidateSize();
        return;
    }

    // Default map centre: Bengaluru
    map = L.map("cityMap").setView([12.9716, 77.5946], 11);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors"
    }).addTo(map);
}


async function loadMapMarkers() {

    if (!map) return;

    mapMarkers.forEach(marker => map.removeLayer(marker));
    mapMarkers = [];

    for (const service of services) {

        try {

            const query = encodeURIComponent(service.location);

            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${query}`
            );

            const results = await response.json();

            if (!results.length) continue;

            const location = results[0];

            const marker = L.marker([
                Number(location.lat),
                Number(location.lon)
            ]).addTo(map);

            marker.bindPopup(`
                <strong>${escapeHTML(service.name)}</strong><br>
                ${escapeHTML(service.category)}<br>
                ${escapeHTML(service.location)}<br>
                Status: ${escapeHTML(service.status)}
            `);

            mapMarkers.push(marker);

            // Avoid sending geocoding requests too quickly
            await new Promise(resolve => setTimeout(resolve, 1100));

        } catch (error) {
            console.error("Map location error:", error);
        }
    }
}


// ===============================
// SECURITY: ESCAPE HTML
// ===============================

function escapeHTML(value) {

    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[char]);
}


// ===============================
// START APPLICATION
// ===============================

async function startApplication() {

    try {

        await loadDashboard();
        await loadServices();
        await loadComplaints();

        showToast("SmartCity application loaded!");

    } catch (error) {
        console.error(error);
    }
}

startApplication();