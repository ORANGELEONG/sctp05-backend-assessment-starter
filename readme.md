To set up this project, perform the following steps

1. In the terminal, run `npm install`
2. Create the database with `mysql -u root < schema.sql` 
3. Import the data with `mysql -u root < data.sql`

UPDATE Employees SET first_name = "hibye", last_name = "sobye", department_id = 1
    WHERE employee_id = 11;