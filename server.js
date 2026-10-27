require("dotenv").config();

const express = require("express");
const path = require("path");
const os = require("os");
const app = express();

const fileuploader = require("express-fileupload");
const cloudinary = require("cloudinary").v2;
const { Pool } = require("pg");
const nodemailer = require("nodemailer");

// ================= Middleware =================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(fileuploader());

// ================= PostgreSQL Config =================
const db = new Pool({
    connectionString: process.env.DATABASE_URL,

    ssl: {
        rejectUnauthorized: false,
    },

    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 20000,
});

// Test DB Connection
db.query("SELECT NOW()")
    .then(() => {
        console.log("PostgreSQL Connected");
    })
    .catch((err) => {
        console.log("DB Connection Error:", err);
    });

// Prevent app crash on DB disconnect
db.on("error", (err) => {
    console.error("Unexpected PostgreSQL Error:", err);
});

// ================= Cloudinary Config =================
cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_API_SECRET,
});

// ================= Routes =================
app.use(express.static("public"));
// Home
app.get("/", function (req, resp) {
    resp.sendFile(path.join(__dirname, "public", "index.html"));
});

// Organizer Profile
app.get("/profile", function (req, resp) {
    resp.sendFile(path.join(__dirname, "public", "profileOrganizer.html"));
});

// Publish Tournament
app.get("/publish", function (req, resp) {
    resp.sendFile(path.join(__dirname, "public", "publish-tournaments.html"));
});

// Tournament Cards
app.get("/cards", function (req, resp) {
    resp.sendFile(path.join(__dirname, "public", "tournament-finder.html"));
});

// Organizer Dashboard
app.get("/dash", function (req, resp) {
    resp.sendFile(path.join(__dirname, "public", "DashOrganizer.html"));
});

// Player Dashboard
app.get("/dash-player", function (req, resp) {
    resp.sendFile(path.join(__dirname, "public", "DashPlayer.html"));
});

// Player Profile
app.get("/profile-player", function (req, resp) {
    resp.sendFile(path.join(__dirname, "public", "profilePlayer.html"));
});

// ================= Contact Form =================
app.post("/contact", async (req, res) => {

    const { name, email, message } = req.body;

    if (!name || !email || !message) {
        return res.status(400).json({
            success: false
        });
    }

    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    const mailOptions = {
        from: `"Sports Tournament" <${process.env.EMAIL_USER}>`,
        to: `${process.env.EMAIL_USER}`,
        subject: `New message from ${name}`,
        html: `
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Message:</strong><br/>${message.replace(/\n/g, "<br/>")}</p>
        `,
        replyTo: email,
    };

    try {

        await transporter.sendMail(mailOptions);

        return res.status(200).json({
            success: true
        });

    } catch (err) {

        console.error("MAIL ERROR:",err);

        return res.status(500).json({
            success: false
        });

    }

});

// ================= SIGNUP =================
app.post("/signup-process", async function (req, resp) {

    let email = req.body.txtMail;
    let pwd = req.body.txtPassword;
    let utype = req.body.utype;

    try {

        const result = await db.query(
            `INSERT INTO users 
            (email, password, usertype, created_at, status) 
            VALUES ($1, $2, $3, CURRENT_DATE, $4)`,
            [email, pwd, utype, 1]
        );

        if (result.rowCount === 1)
            resp.send("Signed Up Successfully");
        else
            resp.send("Failed to sign up.");

    } catch (err) {

        resp.send(err.message);

    }

});

// ================= CHECK USER =================
app.get("/check-user", async function (req, resp) {

    let email = req.query.txtMail;

    try {

        const result = await db.query(
            "SELECT * FROM users WHERE email=$1",
            [email]
        );

        if (result.rows.length > 0)
            resp.send("Already Taken");
        else
            resp.send("Its Available...!!!!!");

    } catch (err) {

        resp.send(err.message);

    }

});

// ================= LOGIN =================
app.post("/login-process", async function (req, res) {

    const { loginemail, loginPassword } = req.body;

    try {

        const result = await db.query(
            "SELECT * FROM users WHERE email=$1 AND password=$2",
            [loginemail, loginPassword]
        );

        if (result.rows.length === 1) {

            return res.json({
                success: true,
                msg: "Logged in successfully!",
                userType: result.rows[0].usertype,
            });

        } else {

            return res.json({
                success: false,
                msg: "Invalid credentials"
            });

        }

    } catch (err) {

        return res.json({
            success: false,
            msg: err.message
        });

    }

});

// ================= SAVE ORGANIZER PROFILE =================
app.post("/save", async function (req, resp) {

    let filename = "nopic.jpg";

    try {

        if (req.files && req.files.profilepic) {

            //let path = __dirname + "/public/uploads/" + req.files.profilepic.name;
            let tempPath = path.join(os.tmpdir(), req.files.profilepic.name);
            
            await req.files.profilepic.mv(tempPath);

            const result = await cloudinary.uploader.upload(tempPath);

            filename = result.url;
        }

        let sports = Array.isArray(req.body.deal)
            ? req.body.deal.join(",")
            : req.body.deal || "";

        const result = await db.query(

            `INSERT INTO organizers
            (email, organization, contact, address, city, proof, ppic, sports, prev, website, insta)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,

            [
                req.body.txtMail,
                req.body.org,
                req.body.contact,
                req.body.address,
                req.body.city,
                req.body.id,
                filename,
                sports,
                req.body.prev,
                req.body.website,
                req.body.insta
            ]

        );

        if (result.rowCount === 1)
            resp.send("saved!");
        else
            resp.send("Failed to save.");

    } catch (err) {

        console.log(err);
        resp.send(err.message);

    }

});

// ================= SEARCH ORGANIZER =================
app.get("/search-user", async function (req, resp) {

    let email = req.query.txtMail;

    try {

        const result = await db.query(
            "SELECT * FROM organizers WHERE email=$1",
            [email]
        );

        resp.send(result.rows);

    } catch (err) {

        resp.send(err.message);

    }

});

// ================= UPDATE ORGANIZER =================
app.post("/update", async function (req, resp) {

    let filename = req.body.oldPic || "nopic.jpg";

    try {

        if (req.files && req.files.profilepic) {

            let tempPath = path.join(os.tmpdir(), req.files.profilepic.name);

            await req.files.profilepic.mv(tempPath);

            const result = await cloudinary.uploader.upload(tempPath);

            filename = result.url;
        }

        let sports = Array.isArray(req.body.deal)
            ? req.body.deal.join(",")
            : req.body.deal || "";

        const result = await db.query(

            `UPDATE organizers SET
            organization=$1,
            contact=$2,
            address=$3,
            city=$4,
            proof=$5,
            ppic=$6,
            sports=$7,
            prev=$8,
            website=$9,
            insta=$10
            WHERE email=$11`,

            [
                req.body.org,
                req.body.contact,
                req.body.address,
                req.body.city,
                req.body.id,
                filename,
                sports,
                req.body.prev,
                req.body.website,
                req.body.insta,
                req.body.txtMail
            ]

        );

        if (result.rowCount === 1)
            resp.send("Updated Succesfully!");
        else
            resp.send("Failed to update profile.");

    } catch (err) {

        console.log(err);
        resp.send(err.message);

    }

});

// ================= ADDED: UPDATE DASHBOARD SETTINGS =================
app.post("/settings-update", async function (req, res) {
    const { email, Password, newPassword } = req.body;

    try {
        const result = await db.query(
            "UPDATE users SET password=\$1 WHERE email=\$2 AND password=\$3",
            [newPassword, email, Password]
        );

        if (result.rowCount === 1) {
            res.send("Password updated successfully!");
        } else {
            res.send("Invalid current email or password details.");
        }
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// ================= SAVE PLAYER PROFILE =================
app.post("/save-profile", async function (req, resp) {

    try {

        let filename = "nopic.jpg";

        if (req.files && req.files.profilepic) {

            let path = __dirname + "/public/uploads/" + req.files.profilepic.name;

            await req.files.profilepic.mv(path);

            const result = await cloudinary.uploader.upload(path);

            filename = result.url;
        }

        let sports = Array.isArray(req.body.sports)
            ? req.body.sports.join(",")
            : req.body.sports || "";

        const result = await db.query(

            `INSERT INTO players
            (email,name,organization,number,address,city,proof,picpath,sports,prev_tour)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,

            [
                req.body.txtmail,
                req.body.name,
                req.body.organization,
                req.body.number,
                req.body.address,
                req.body.city,
                req.body.proof,
                filename,
                sports,
                req.body.prev_tour
            ]

        );

        if (result.rowCount === 1)
            resp.send("Player profile saved successfully.");
        else
            resp.send("Failed to save profile.");

    } catch (err) {

        console.log(err);
        resp.status(500).send(err.message);

    }

});

// ================= FETCH PLAYER PROFILE =================
app.get("/fetch-profile", async function (req, resp) {

    try {

        const result = await db.query(
            "SELECT * FROM players WHERE email=$1",
            [req.query.txtmail]
        );

        resp.send(result.rows);

    } catch (err) {

        console.log(err);
        resp.send(err.message);

    }

});

// ================= UPDATE PLAYER PROFILE =================
app.post("/update-profile", async function (req, resp) {

    try {

        // Default old image
        let filename = req.body.picpath || "nopic.jpg";

        // Upload new image if selected
        if (req.files && req.files.proofpic) {

            let path = __dirname + "/public/uploads/" + req.files.proofpic.name;

            // Move file to uploads folder
            await req.files.proofpic.mv(path);

            // Upload to Cloudinary
            const result = await cloudinary.uploader.upload(path);

            // Save Cloudinary URL
            filename = result.url;
        }

        // Convert sports array into comma separated string
        let sports = Array.isArray(req.body.sports)
            ? req.body.sports.join(",")
            : req.body.sports || "";

        // Update database
        const result = await db.query(

            `UPDATE players SET
            name=$1,
            organization=$2,
            number=$3,
            address=$4,
            city=$5,
            proof=$6,
            picpath=$7,
            sports=$8,
            prev_tour=$9
            WHERE email=$10`,

            [
                req.body.name,
                req.body.organization,
                req.body.number,
                req.body.address,
                req.body.city,
                req.body.proof,
                filename,
                sports,
                req.body.prev_tour,
                req.body.txtmail
            ]

        );

        if (result.rowCount === 1)
            resp.send("Player profile updated successfully.");
        else
            resp.send("No profile found.");

    } catch (err) {

        console.log(err);
        resp.status(500).send(err.message);

    }

});

// ================= SETTINGS =================
app.post("/settings", async function (req, resp) {

    let emailid = req.body.email;
    let password = req.body.Password;
    let newpwd = req.body.newPassword;

    try {

        const result = await db.query(
            "UPDATE users SET password=$1 WHERE email=$2 AND password=$3",
            [newpwd, emailid, password]
        );

        if (result.rowCount === 1)
            resp.send("Updated successfully");
        else
            resp.send("Incorrect email or password");

    } catch (err) {

        console.log(err);
        resp.send(err.message);

    }

});

// ================= PUBLISH TOURNAMENT =================
app.post("/publish-tournament", async function (req, resp) {

    try {

        let filename = "nopic.jpg";

        if (req.files && req.files.profilepic) {

            let path = __dirname + "/public/uploads/" + req.files.profilepic.name;

            await req.files.profilepic.mv(path);

            const result = await cloudinary.uploader.upload(path);

            filename = result.url;
        }

        const result = await db.query(

            `INSERT INTO tournaments
            (email,game,title,fee,date,city,location,prize,pic,info)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,

            [
                req.body.txtMail,
                req.body.game,
                req.body.title,
                req.body.fee || 0,
                req.body.date||null,
                req.body.city,
                req.body.loc,
                req.body.prize,
                filename,
                req.body.info
            ]

        );

        if (result.rowCount === 1) {

            resp.json({
                success: true,
                msg: "Tournament saved successfully!"
            });

        } else {

            resp.json({
                success: false,
                msg: "Failed to save tournament"
            });

        }

    } catch (err) {

        console.log(err);

        resp.status(500).json({
            success: false,
            msg: err.message
        });

    }

});

// ================= SHOW TOURNAMENTS =================
app.get("/showRecords", async function (req, resp) {

    try {

        const result = await db.query(
            "SELECT * FROM tournaments WHERE city=$1 AND game=$2",
            [req.query.city, req.query.game]
        );

        resp.send(result.rows);

    } catch (err) {

        console.log(err);
        resp.send(err.message);

    }

});

// ================= SHOW CITIES =================
app.get("/showCities", async function (req, resp) {

    try {

        const result = await db.query(
            "SELECT DISTINCT city FROM tournaments"
        );

        resp.send(result.rows);

    } catch (err) {

        console.log(err);
        resp.send(err.message);

    }

});

// ================= SHOW GAMES =================
app.get("/showGames", async function (req, resp) {

    try {

        const result = await db.query(
            "SELECT DISTINCT game FROM tournaments"
        );

        resp.send(result.rows);

    } catch (err) {

        console.log(err);
        resp.send(err.message);

    }

});
// ================= UPLOAD PROOF =================
app.post("/upload-proof", async function (req, resp) {

    try {

        if (!req.files || !req.files.proofpic) {

            return resp.status(400).send("No file uploaded");

        }

        let file = req.files.proofpic;

        // Local temporary path
        let path = __dirname + "/public/uploads/" + file.name;

        // Move file locally
        await file.mv(path);

        // Upload to Cloudinary
        const result = await cloudinary.uploader.upload(path);

        // Send uploaded image URL
        resp.json({
            success: true,
            url: result.url
        });

    } catch (err) {

        console.log(err);

        resp.status(500).send(err.message);

    }

});
// ================= Server =================
// app.listen(2002, function () {
//     console.log("Server Started on port 2002");
// });
const PORT = process.env.PORT || 2002;

app.listen(PORT, function () {
    console.log(`Server Started on port ${PORT}`);
});
