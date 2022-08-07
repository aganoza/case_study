import { createMachine, assign, send, interpret } from "xstate";
import company_data from "./company_data.json";
import employee_data from "./employee_data.json";

function getCompanyById(company_id, company_data) {
  const [company] = company_data.filter((company) => company.id === company_id);

  if (company == null) {
    throw new Error(`Company with id:${company_id} doesn't exists`);
  }

  const company_edited = { ...company, contact_email: company.email };
  const { id, email, ...company_info } = company_edited;
  return company_info;
}

function getEmployeesByCompanyId(company_id, employee_data) {
  const employeesFromCompanyId =
    employee_data.filter((employee) => employee.company_id === company_id) ??
    [];
  return employeesFromCompanyId;
}

const employees_with_company = employee_data.map((employee) => ({
  ...employee,
  ...getCompanyById(employee.company_id, company_data),
}));

const elFilter = document.querySelector("#filter");
const elEmployeesTableBody = document.querySelector("#employees");

const elCompanyName = document.querySelector("#company_name");
const elContactName = document.querySelector("#contact_name");
const elContactEmail = document.querySelector("#contact_email");
const elCompanyEmployeesList = document.querySelector("#company_employees");

const elNewFirstName = document.querySelector("#new_employee_first_name");
const elNewLastName = document.querySelector("#new_employee_last_name");
const elNewEmail = document.querySelector("#new_employee_email");

const elCreate = document.querySelector("#create");

function addClickListenerCompanyIdButtons() {
  const elAllCompanyIdButtons = document.querySelectorAll("#companyId");

  Array.from(elAllCompanyIdButtons).forEach((companyButton) => {
    companyButton.addEventListener("click", (e) => {
      // console.log(e.target.value, typeof e.target.value);
      service.send({ type: "SELECT", companyId: +e.target.value });
    });
  });
}

function updateEmployees(ctx) {
  elEmployeesTableBody.innerHTML = "";

  const filter = ctx.filter.toUpperCase().trim().replace(/  +/g, " ");
  const filteredEmployees = ctx.employees.filter((employee) => {
    return (
      `${employee.first_name.toUpperCase()} ${employee.last_name.toUpperCase()} ${employee.company_name.toUpperCase()}`.includes(
        filter
      ) ||
      `${employee.first_name.toUpperCase()} ${employee.company_name.toUpperCase()} ${employee.last_name.toUpperCase()}`.includes(
        filter
      ) ||
      `${employee.last_name.toUpperCase()} ${employee.first_name.toUpperCase()} ${employee.company_name.toUpperCase()}`.includes(
        filter
      ) ||
      `${employee.last_name.toUpperCase()} ${employee.company_name.toUpperCase()} ${employee.first_name.toUpperCase()}`.includes(
        filter
      ) ||
      `${employee.company_name.toUpperCase()} ${employee.first_name.toUpperCase()} ${employee.last_name.toUpperCase()}`.includes(
        filter
      ) ||
      `${employee.company_name.toUpperCase()} ${employee.last_name.toUpperCase()} ${employee.first_name.toUpperCase()}`.includes(
        filter
      )
    );
  });

  filteredEmployees.forEach((employee) => {
    let row = document.createElement("tr");

    let colCompany = document.createElement("td");
    let buttonCompany = document.createElement("button");
    buttonCompany.id = "companyId";
    buttonCompany.className = "btn btn-link text-primary";
    buttonCompany.type = "button";
    buttonCompany.setAttribute("value", employee.company_id);
    buttonCompany.innerText = `${employee.company_name}`;

    let colEmployee = document.createElement("td");
    colEmployee.style = "vertical-align: middle;";
    colEmployee.innerText = `${employee.first_name} ${employee.last_name}`;

    let colEmail = document.createElement("td");
    colEmail.style = "vertical-align: middle;";
    colEmail.innerText = `${employee.email}`;

    colCompany.appendChild(buttonCompany);
    row.appendChild(colCompany);
    row.appendChild(colEmployee);
    row.appendChild(colEmail);
    elEmployeesTableBody.appendChild(row);
  });

  addClickListenerCompanyIdButtons();
}

function updateFields(ctx) {
  elFilter.value = ctx.filter;
  elCompanyName.value = ctx.company_name;
  elContactName.value = ctx.contact_name;
  elContactEmail.value = ctx.contact_email;

  elCompanyEmployeesList.innerHTML = "";
  getEmployeesByCompanyId(ctx.selectedCompanyId, ctx.employees)
    .sort((a, b) => b.id - a.id)
    .forEach((employee) => {
      let option = document.createElement("option");
      option.innerText = `${employee.id}: ${employee.first_name} ${employee.last_name} - ${employee.email}`;
      option.setAttribute("value", employee.id);
      elCompanyEmployeesList.appendChild(option);
    });

  elNewFirstName.value = ctx.newFirstName;
  elNewLastName.value = ctx.newLastName;
  elNewEmail.value = ctx.newEmail;
  elNewFirstName.disabled = ctx.selectedCompanyId == null;
  elNewLastName.disabled = ctx.selectedCompanyId == null;
  elNewEmail.disabled = ctx.selectedCompanyId == null;
}

const machine = createMachine({
  context: {
    companies: company_data,
    employees: employees_with_company,
    company_name: "",
    contact_name: "",
    contact_email: "",
    selectedCompanyId: null,
    filter: "",
    newFirstName: "",
    newLastName: "",
    newEmail: "",
  },
  entry: updateEmployees,
  id: "machine",
  initial: "listEmployees",
  states: {
    listEmployees: {
      entry: [
        assign({
          company_name: "",
          contact_name: "",
          contact_email: "",
          newFirstName: "",
          newLastName: "",
          newEmail: "",
          selectedCompanyId: null,
        }),
        updateFields,
      ],
    },
    viewCompanyDetails: {
      on: {
        CREATE: {
          actions: [
            assign({
              employees: (ctx) => {
                return ctx.employees.concat({
                  id: ctx.employees.length + 1,
                  first_name: ctx.newFirstName,
                  last_name: ctx.newLastName,
                  email: ctx.newEmail,
                  company_name: getCompanyById(
                    ctx.selectedCompanyId,
                    company_data
                  ).company_name,
                  company_id: ctx.selectedCompanyId,
                });
              },
              newFirstName: "",
              newLastName: "",
              newEmail: "",
            }),
            updateEmployees,
            updateFields,
          ],
          cond: (ctx) =>
            !!ctx.newFirstName && !!ctx.newLastName && !!ctx.newEmail,
        },
      },
    },
  },
  on: {
    "newFirstName.change": {
      actions: assign({
        newFirstName: (ctx, e) => e.value,
      }),
    },
    "newLastname.change": {
      actions: assign({
        newLastName: (ctx, e) => e.value,
      }),
    },
    "newEmail.change": {
      actions: assign({
        newEmail: (ctx, e) => e.value,
      }),
    },
    SELECT: {
      actions: [
        assign({
          selectedCompanyId: (_, e) => e.companyId,
          company_name: (ctx, e) => ctx.companies[e.companyId - 1].company_name,
          contact_name: (ctx, e) =>
            `${ctx.companies[e.companyId - 1].contact_first_name} ${
              ctx.companies[e.companyId - 1].contact_last_name
            }`,
          contact_email: (ctx, e) => ctx.companies[e.companyId - 1].email,
          newFirstName: "",
          newLastName: "",
          newEmail: "",
        }),
        updateFields,
      ],
      target: ".viewCompanyDetails",
    },
    FILTER: {
      actions: [
        assign({
          filter: (_, e) => e.value,
        }),
        updateEmployees,
        updateFields,
      ],
    },
  },
});

const service = interpret(machine)
  .onTransition((state) => {
    const {
      users,
      companies,
      ...rest
      // employees,
      // company_name,
      // contact_name,
      // contact_email,
      // selectedCompanyId,
      // newFirstName,
      // newLastName,
      // newEmail,
      // filter,
    } = state.context;
    // console.log(rest);

    // console.log(state.context);

    elCreate.disabled = !state.can("CREATE");
  })
  .start();

elFilter.addEventListener("input", (e) => {
  service.send({ type: "FILTER", value: e.target.value });
});

elNewFirstName.addEventListener("input", (e) => {
  service.send({ type: "newFirstName.change", value: e.target.value });
});

elNewLastName.addEventListener("input", (e) => {
  service.send({ type: "newLastname.change", value: e.target.value });
});

elNewEmail.addEventListener("input", (e) => {
  service.send({ type: "newEmail.change", value: e.target.value });
});

elCreate.addEventListener("click", (e) => {
  service.send("CREATE");
});
