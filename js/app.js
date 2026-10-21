
const pageNames = {
  dashboard: "Dashboard",
  scholars: "Scholars",
  submissions: "Grade Submissions",
  verification: "Verification",
  compliance: "Compliance",
  renewals: "Renewal Decisions",
  history: "Activity History"
};

const pageTitle = document.getElementById("pageTitle");
const breadcrumb = document.getElementById("breadcrumb");
const welcomeTitle = document.getElementById("welcomeTitle");
const welcomeText = document.getElementById("welcomeText");
const tableTitle = document.getElementById("tableTitle");
const searchInput = document.getElementById("searchInput");
const statusFilter = document.getElementById("statusFilter");
const tableBody = document.getElementById("submissionTable");
const resultCount = document.getElementById("resultCount");
const sidebar = document.getElementById("sidebar");

const dateElement = document.getElementById("todayDate");

dateElement.textContent = new Intl.DateTimeFormat("en-PH", {
  year: "numeric",
  month: "short",
  day: "numeric",
  timeZone: "Asia/Manila"
}).format(new Date());

function showPage(page) {
  const title = pageNames[page] || pageNames.dashboard;

  pageTitle.textContent = title === "Dashboard"
    ? "Dashboard Overview"
    : title;

  breadcrumb.textContent = title;
  welcomeTitle.textContent = title;

  welcomeText.textContent = title === "Dashboard"
    ? "Monitor scholarship submissions and academic compliance in one place."
    : `${title} workspace. Database integration is the next development step.`;

  tableTitle.textContent = title === "Dashboard"
    ? "Recent Grade Submissions"
    : `${title} Preview`;

  document.querySelectorAll(".nav-item").forEach(button => {
    const isActive = button.dataset.page === page;
    button.classList.toggle("active", isActive);

    if (isActive) {
      button.setAttribute("aria-current", "page");
    } else {
      button.removeAttribute("aria-current");
    }
  });

  sidebar.classList.remove("open");

  // Other sections will be connected to real database data
  // in the next development steps.
}

document.querySelectorAll(".nav-item").forEach(button => {
  button.addEventListener("click", () => {
    showPage(button.dataset.page);
  });
});

document.getElementById("menuButton").addEventListener("click", () => {
  sidebar.classList.toggle("open");
});

function filterRows() {
  const query = searchInput.value.trim().toLowerCase();
  const selectedStatus = statusFilter.value;
  let visibleRows = 0;

  tableBody.querySelectorAll("tr").forEach(row => {
    if (!row.dataset.status) return;

    const text = row.textContent.toLowerCase();
    const status = row.dataset.status;
    const compliance = row.dataset.compliance;

    const matchesSearch = text.includes(query);
    const matchesStatus = selectedStatus === "all"
      || status === selectedStatus
      || compliance === selectedStatus;

    const show = matchesSearch && matchesStatus;
    row.hidden = !show;

    if (show) visibleRows++;
  });

  resultCount.textContent =
    `Showing ${visibleRows} sample record${visibleRows === 1 ? "" : "s"}`;
}

searchInput.addEventListener("input", filterRows);
statusFilter.addEventListener("change", filterRows);

// Keep this explicit: this first version is only a UI preview.
console.info("ScholarTrack UI loaded. Supabase is not connected yet.");
