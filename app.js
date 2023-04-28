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


// Dette er hovedsiden, du søker bare på http://localhost:3000/ og får opp en html side
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "/index.html"))
})

//Disse to er veier til registrer og login siden, de er koblet til hver sin knapp i navbaren på de fleste sidene
app.get("/registrer", (req, res) => {
    res.sendFile(path.join(__dirname, "/Public/registrer.html"))
})
app.get("/login", (req, res) => {
    res.sendFile(path.join(__dirname, "/Public/login.html"))
})

app.get("/registerting", (req, res) => {
    res.sendFile(path.join(__dirname, "/Public/registrerting.html"))
})

app.get("/bestilling", (req, res) => {
    res.render(path.join(__dirname, "/views/pages/bestillingsside.hbs"))
})

app.get("/admin", (req, res) => {
  if (req.session.loggedin) {
      res.sendFile(path.join(__dirname, "/Public/admin.html"));
  } else {
      res.redirect("/");
  }
});

app.post("/login", async (req, res) => {
  
    let login = req.body;
    let userData = db.prepare("SELECT * FROM users WHERE email = ?").get(login.email);
    
    // Her bruker jeg await for å gi bcrypt.compare nok til til å sammen ligne passordet du skrev inn med hashen som ligger i databasen
    if (userData && await bcrypt.compare(login.password, userData.password)) {
        // hvis passordet du skrev in er lik hashen blir du redirected til index.html og hvis de er ikke lik blir du redirected tilbake
        req.session.loggedin = true;
        res.redirect("/");
        console.log(req.session.loggedin);
    } else {
        res.redirect("back");
    }
});

// Når du tyrkker på logg ut kjører den her. Den gjør om din cookie session fra true til false og redirecter deg til index.html
app.get("/logut", (req, res) => {
    req.session.loggedin = false;
    res.redirect("/");
});

// Etter du har skrevet inn dine opplysninger og trykker på registrer
app.post(("/addUser"), async (req, res) => {
    // henter ut hva du har skrevet
    let svar = req.body;
    // omgjør passordet du skrev inn til hash
    let password = await bcrypt.hash(svar.password, 10)
    //console.log(svar)
    //console.log(password)
    // sender alt til database og der etter sender deg tilbake
    db.prepare("INSERT INTO users (username, password, email, role) VALUES (?, ?, ?, ?)").run(svar.username, password, svar.email, svar.role)
    res.redirect("back")    
})


app.post(("/addDevices"), async (req,res) => {
    let svar = req.body;
    db.prepare("INSERT INTO devices (device_name, device_type, device_status, description) VALUES (?, ?, ?, ?)").run(svar.device_name, svar.device_type, svar.device_status, svar.description)
    res.redirect("back")
})

app.post(("/addAccessories"), async (req,res) => {
    let svar = req.body;
    db.prepare("INSERT INTO device_accessories (accessory_name, accessory_description, device_id) VALUES (?, ?, ?)").run(svar.accessory_name, svar.accessory_description, svar.device_id)
    res.redirect("back")
})

/*
app.post(("/reseverUtstyr"), async (req,res) => {
    let svar = req.body;
    reserverUtstyr(svar.user_id, svar.device_id)
    res.redirect("back")
})

function reserverUtstyr(user_id, accessory_id) {
  const bruker = db.prepare('SELECT * FROM users WHERE user_id = ?').get(user_id);
  const utstyr = db.prepare('SELECT * FROM devices WHERE device_id = ?').get(device_id);

  if (!bruker || !utstyr) {
    return false;
  }

  // Sjekk om utstyret er tilgjengelig
  if (utstyr.antall < 1) {
    return false;
  }

db.transaction(() => {
  db.prepare('UPDATE devices SET antall = antall - 1 WHERE device_id = ?').run();
});
}
*/

app.listen("3000", () => {
    console.log("Server listening at http://localhost:3000")
})