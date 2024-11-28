var express = require("express");
var mongoose = require("mongoose");
var app = express();
var database = require("./config/database");
var bodyParser = require("body-parser");

var port = process.env.PORT || 8000;
app.use(bodyParser.urlencoded({ extended: "true" }));
app.use(bodyParser.json());
app.use(bodyParser.json({ type: "application/vnd.api+json" }));

mongoose
  .connect(database.url)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("Could not connect to MongoDB", err));

var Employee = require("./models/employee");

// get all employee data from db
app.get("/api/employees", async function (req, res) {
  try {
    const employees = await Employee.find();
    res.json(employees);
  } catch (err) {
    res.status(500).send(err);
  }
});

// get an employee with specific ID
app.get("/api/employees/:employee_id", async function (req, res) {
  try {
    let id = req.params.employee_id;
    const employee = await Employee.findById(id);
    if (!employee) {
      return res.status(404).send("Employee not found");
    }
    res.json(employee);
  } catch (err) {
    res.status(500).send(err);
  }
});

// create employee and send back all employees after creation
app.post("/api/employees", async function (req, res) {
  try {
    console.log(req.body);
    const employee = await Employee.create({
      name: req.body.name,
      salary: req.body.salary,
      age: req.body.age,
    });
    const employees = await Employee.find();
    res.json(employees);
  } catch (err) {
    res.status(500).send(err);
  }
});

// update an employee
app.put("/api/employees/:employee_id", async function (req, res) {
  try {
    console.log(req.body);
    let id = req.params.employee_id;
    var data = {
      name: req.body.name,
      salary: req.body.salary,
      age: req.body.age,
    };
    const employee = await Employee.findByIdAndUpdate(id, data, { new: true });
    if (!employee) {
      return res.status(404).send("Employee not found");
    }
    res.send("Successfully! Employee updated - " + employee.name);
  } catch (err) {
    res.status(500).send(err);
  }
});

// delete an employee by id
app.delete("/api/employees/:employee_id", async function (req, res) {
  try {
    console.log(req.params.employee_id);
    let id = req.params.employee_id;
    const result = await Employee.findByIdAndDelete(id);
    if (!result) {
      return res.status(404).send("Employee not found");
    }
    res.send("Successfully! Employee has been Deleted.");
  } catch (err) {
    res.status(500).send(err);
  }
});

app.listen(port);
console.log("App listening on port : " + port);
