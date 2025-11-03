# 🎨 Adobe XD to HTML Conversion with API Integration

This project involves converting an Adobe XD design into a fully functional, responsive HTML webpage and integrating API calls to dynamically populate UI elements.

---

## 🚀 Project Overview

The goal of this project is to:
- Convert an Adobe XD template into a working **HTML, CSS, and JavaScript** interface.
- Fetch and display real-time data from a mock or live API.
- Maintain design accuracy, responsiveness, and code quality.

**Adobe XD Template:**  
[View Design](https://xd.adobe.com/view/121254c9-532f-4772-a1ba-dfe529a96b39-4741/)

---

## 🛠️ Tech Stack

| Category | Technology |
|-----------|-------------|
| Frontend  | HTML5, CSS3, JavaScript (Vanilla / Fetch API) |
| Tools     | Adobe XD, VS Code, Chrome DevTools |
| APIs      | REST API (JSON) |
| Version Control | Git / GitHub |

---

## 📂 Folder Structure



project/
│
├── index.html # Main HTML page
├── assets/
│ ├── css/
│ │ └── style.css # Custom styles
│ ├── js/
│ │ └── script.js # JavaScript logic and API calls
│ └── images/ # All image assets
│
├── data/
│ └── sample.json # Mock API data (for local testing)
│
└── README.md # Project documentation


---

## ⚙️ How to Run

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/xd-to-html-api.git
   cd xd-to-html-api


Open in browser

Open index.html directly or use Live Server (VS Code extension)


API Call Setup

If using mock data:
Update the API endpoint in script.js

fetch('./data/sample.json')


If using a live API:
Replace it with your real endpoint:

fetch('https://api.example.com/data')

🧠 Features

✅ Fully responsive UI built from Adobe XD design

🔄 Dynamic data loading via API

🎨 Clean, semantic HTML structure

⚡ Optimized CSS & JS for performance

🧩 Easy to maintain and extend

🧪 API Example

Example API response:

{
  "title": "Welcome to the Dashboard",
  "stats": {
    "users": 245,
    "sales": 180,
    "growth": "12%"
  }
}


Example usage in script.js:

fetch('./data/sample.json')
  .then(res => res.json())
  .then(data => {
    document.getElementById('title').innerText = data.title;
  });
