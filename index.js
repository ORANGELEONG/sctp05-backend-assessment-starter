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

const helpers = require('handlebars-helpers');
helpers({
    handlebars: hbs.handlebars // link handlebar helpers to the generic version of handlebars inside hbs
})


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
        const firstName = req.query.first_name;
        const lastName = req.query.last_name;
        const departmentId = req.query.department_id;
    
        let sql = `SELECT Employees.*, Departments.name FROM Employees
                   JOIN Departments ON Employees.department_id = Departments.department_id WHERE 1`;
    
        const bindings = [];
    
        if (firstName) {
            sql += " AND first_name LIKE ?";
            bindings.push('%' + firstName + '%');
        }
    
        if (lastName) {
            sql += " AND last_name LIKE ?";
            bindings.push('%' + lastName + '%');
        }
    
        if (departmentId) {
            sql += " AND Employees.department_id = ?";
            bindings.push(departmentId);
        }
    
        const [employees] = await connection.execute(sql, bindings);
        const [departments] = await connection.execute("SELECT * FROM Departments");
    
        res.render('employees/index', {
            "employees": employees,
            "searchParams": req.query,
            "departments": departments
        });
    });

    app.get('/employees/create', async function (req, res) {
        const results = await connection.execute("SELECT * FROM Departments");
        const departments = results[0]

        res.render('employees/create', {
            "departments": departments
        })
    })

    app.post('/employees/create', async function (req, res) {

        const firstName = req.body.first_name;
        const lastName = req.body.last_name;
        const department = req.body.department_id;

        const sql = ` INSERT INTO Employees (first_name, last_name, department_id)
    VALUES (?, ?, ?); `
        const bindings = [firstName, lastName, department]

        await connection.execute(sql, bindings);
        res.redirect("/employees");

    });

    app.get('/employees/:employee_id/delete', async function (req, res) {
        try {
            const employeeId = req.params.employee_id;
            const results = await connection.execute(`
        SELECT * FROM Employees WHERE employee_id = ? 
        `, [employeeId])

            const employees = results[0];

            const employeeToDelete = employees[0];

            res.render('employees/delete', {
                "employee": employeeToDelete
            })

        } catch (e) {
            res.send("Unable to process delete");
        }
    });

    app.post('/employees/:employee_id/delete', async function (req, res) {
        try {
            const employeeId = req.params.employee_id;
            const query = 'DELETE FROM Employees WHERE employee_id = ?';
            await connection.execute(query, [employeeId]);
            res.redirect('/employees');
        } catch (e) {
            console.log(e);
            res.render("error", {
                'errorMessage': 'Unable to process delete. Contact admin or try again'
            })
        }
    })

    app.get('/employees/:employee_id/edit', async function (req, res) {
        const bindings = [req.params.employee_id]

        const [employees] = await connection.execute("SELECT * FROM Employees WHERE employee_id = ?", bindings);
        const employeeToUpdate = employees[0];

        const [departments] = await connection.execute("SELECT * FROM Departments");

        res.render('employees/update', {
            employee: employeeToUpdate,
            departments: departments
        })
    })

    app.post('/employees/:employee_id/edit', async function (req, res) {
        const query = `
    UPDATE Employees SET first_name = ?, last_name = ?, department_id = ?
    WHERE employee_id = ?;
    `

        const bindings = [req.body.first_name,
        req.body.last_name,
        req.body.department_id,
        req.params.employee_id
        ];

        await connection.execute(query, bindings);
        res.redirect("/employees");


    })

}

main();

app.listen(3001, () => {
    console.log('Server is running')
})

