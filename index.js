const express = require('express');
const hbs = require('hbs');
const wax = require('wax-on');
require('dotenv').config();
const { createConnection } = require('mysql2/promise');

let app = express();
app.set('view engine', 'hbs');
app.use(express.static('public'));
app.use(express.urlencoded({ extended: false }));

wax.on(hbs.handlebars);
wax.setLayoutPath('./views/layouts');

let connection;

async function main() {
    connection = await createConnection({
        'host': process.env.DB_HOST,
        'user': process.env.DB_USER,
        'database': process.env.DB_NAME,
        'password': process.env.DB_PASSWORD
    })

    app.get("/", function (req, res) {
        res.render('home')
    });



    app.get('/employees', async function (req, res) {
        const results = await connection.execute(`SELECT * FROM Employees
        JOIN Departments
        ON Employees.department_id = Departments.department_id;`);

        const employees = results[0];
        console.log(employees);
        res.render('employees/index', {
            "employees": employees,
        });
    });

app.get('/employees/create', async function (req, res) {
    const results = await connection.execute("SELECT * FROM Departments");
    const departments = results[0]

    res.render('employees/create', {
        "departments" : departments
    })
})




}


main();

app.listen(3000, () => {
    console.log('Server is running')
})

