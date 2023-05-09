const express = require("express");
const session = require("express-session");
const bcrypt = require("bcrypt");
const db = require("better-sqlite3")("data.db"); //{verbose: console.log}
const hbs = require("hbs");
const path = require("path");

const app = express();     

app.use(session({
    secret: "detteherersjult",
    resave: false,
    saveUninitialized: false // Cookies settes ikke før endringer har blitt gjort på nettsiden
})) 

app.use(express.static(path.join(__dirname, "Public")));
app.use(express.urlencoded({extended: true}))
app.set("view engine", hbs);
app.set("views", path.join(__dirname, "./views/pages"))


// Dette er hovedsiden: http://localhost:3000/ og får opp login siden
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "/index.html"))
})

app.get("/registrer", (req, res) => {
    res.sendFile(path.join(__dirname, "/Public/registrer.html"))
})

app.get("/registerting", (req, res) => {
    res.sendFile(path.join(__dirname, "/Public/registrereting.html"))
})

app.get("/bestilling", (req, res) => {
  let devices = db.prepare("SELECT * FROM devices").all();
  console.log(devices);
  let objekt = {devices: devices};
  res.render("bestillingsside.hbs", objekt);
});

app.get("/admin", (req, res) => {
      res.sendFile(path.join(__dirname, "/Public/admin.html"));
  }
);
app.get("/elev", (req, res) => {
      res.sendFile(path.join(__dirname, "/Public/elev.html"));
  });

app.get("/larer", (req, res) => {
      res.sendFile(path.join(__dirname, "/Public/larer.html"));
});

app.get("/logut", (req, res) => {
        req.session.loggedin = false;
        res.redirect("/");
});
    
app.post("/login", async (req, res) => {
    let login = req.body;
    let userData = db.prepare("SELECT * FROM users WHERE email = ?").get(login.email);
  
    if (userData && (await bcrypt.compare(login.password, userData.password))) {
      req.session.loggedin = true;
      req.session.user = userData;
  
      if (userData.role === "Administrator") {
        res.redirect("/admin");
      } else if (userData.role === "Elev") {
        res.redirect("/elev");
      } else if (userData.role === "Lærer") {
        res.redirect("/larer");
      } else {
        res.redirect("/");
      }
    } else {
      res.redirect("back");
    }
  });

app.post(("/addUser"), async (req, res) => {
    let svar = req.body;
    let password = await bcrypt.hash(svar.password, 10)
    db.prepare("INSERT INTO users (username, password, email, role) VALUES (?, ?, ?, ?)").run(svar.username, password, svar.email, svar.role)
    res.redirect("back")    
})

app.post(("/addDevices"), async (req,res) => {
    let svar = req.body;
    db.prepare("INSERT INTO devices (device_name, device_status, description) VALUES (?, ?, ?)").run(svar.device_name, svar.device_status, svar.description)
    res.redirect("back")
})

app.post(("/addAccessories"), async (req,res) => {
    let svar = req.body;
    db.prepare("INSERT INTO device_accessories (accessory_name, accessory_description, device_id) VALUES (?, ?, ?)").run(svar.accessory_name, svar.accessory_description, svar.device_id)
    res.redirect("back")
})


app.listen("3000", () => {
    console.log("Server listening at http://localhost:3000")
})