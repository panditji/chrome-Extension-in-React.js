// src/components/pagination.table.js
import React, { useState, useEffect } from "react";
import ReactHTMLTableToExcel from "react-html-table-to-excel";
import {
  useTable,
  useSortBy,
  usePagination,
  useFilters,
  useGlobalFilter,
  useAsyncDebounce,
  useRowSelect,
} from "react-table";
import "../../node_modules/bootstrap/dist/css/bootstrap.min.css";
import rp from "request-promise";
// import cheerio, { contains } from "cheerio";
import cheerio from "cheerio";

//  select and deselect
const IndeterminateCheckbox = React.forwardRef(
  ({ indeterminate, ...rest }, ref) => {
    const defaultRef = React.useRef();
    const resolvedRef = ref || defaultRef;

    React.useEffect(() => {
      resolvedRef.current.indeterminate = indeterminate;
    }, [resolvedRef, indeterminate]);

    return (
      <>
        <input type="checkbox" ref={resolvedRef} {...rest} />
      </>
    );
  }
);
//end of select and deselect
// Define a default UI for filtering
function GlobalFilter({
  preGlobalFilteredRows,
  globalFilter,
  setGlobalFilter,
}) {
  const count = preGlobalFilteredRows.length;
  const [value, setValue] = React.useState(globalFilter);
  const onChange = useAsyncDebounce((value) => {
    setGlobalFilter(value || undefined);
  }, 200);

  return (
    <span>
      Search:{" "}
      <input
        className="form-control"
        value={value || ""}
        onChange={(e) => {
          setValue(e.target.value);
          onChange(e.target.value);
        }}
        placeholder={`${count} records...`}
      />
    </span>
  );
}
function DefaultColumnFilter({
  column: { filterValue, preFilteredRows, setFilter },
}) {
  const count = preFilteredRows.length;

  return (
    <input
      className="form-control"
      value={filterValue || ""}
      onChange={(e) => {
        setFilter(e.target.value || undefined);
      }}
      placeholder={`Search ${count} records...`}
    />
  );
}

function Table({ columns, data }) {
  const defaultColumn = React.useMemo(
    () => ({
      // Default Filter UI
      Filter: DefaultColumnFilter,
    }),
    []
  );
  // Use the state and functions returned from useTable to build your UI
  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
    state,
    preGlobalFilteredRows,
    setGlobalFilter,
  } = useTable(
    {
      columns,
      data,
      defaultColumn,
      initialState: { pageIndex: 1, pageSize: 5 },
    },
    useFilters,
    useGlobalFilter,
    useSortBy,
    usePagination,
    useRowSelect,
    (hooks) => {
      hooks.visibleColumns.push((columns) => [
        // Let's make a column for selection
        {
          id: "selection",
          // The header can use the table's getToggleAllRowsSelectedProps method
          // to render a checkbox
          Header: ({ getToggleAllRowsSelectedProps }) => (
            <div>
              <IndeterminateCheckbox {...getToggleAllRowsSelectedProps()} />
            </div>
          ),
          // The cell can use the individual row's getToggleRowSelectedProps method
          // to the render a checkbox
          Cell: ({ row }) => (
            <div>
              <IndeterminateCheckbox {...row.getToggleRowSelectedProps()} />
            </div>
          ),
        },
        ...columns,
      ]);
    }
  );

  // Render the UI for your table
  return (
    <div>
      <GlobalFilter
        preGlobalFilteredRows={preGlobalFilteredRows}
        globalFilter={state.globalFilter}
        setGlobalFilter={setGlobalFilter}
      />
      <ReactHTMLTableToExcel
        id="test-table-xls-button"
        className="btn btn-info"
        table="emp"
        filename="tablexls"
        sheet="Sheet"
        buttonText="Export excel"
        style={["margin-right:0"]}
      />
      <table id="emp" className="table" {...getTableProps()}>
        <thead>
          {headerGroups.map((headerGroup) => (
            <tr {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map((column) => (
                // Add the sorting props to control sorting. For this example
                // we can add them into the header props
                <th {...column.getHeaderProps(column.getSortByToggleProps())}>
                  {column.render("Header")}
                  {/* Add a sort direction indicator */}
                  <span>
                    {column.isSorted
                      ? column.isSortedDesc
                        ? " 🔽"
                        : " 🔼"
                      : ""}
                  </span>
                  
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody {...getTableBodyProps()}>
          {rows.map((row, i) => {
            prepareRow(row);
            return (
              <tr {...row.getRowProps()}>
                {row.cells.map((cell) => {
                  return (
                    <td {...cell.getCellProps()}>{cell.render("Cell")}</td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function PaginationTableComponent() {
  const [names, setValue] = useState([]);
  useEffect(() => {
    rp(
      "https://cors-anywhere.herokuapp.com/https://scrapethissite.com/pages/frames/?frame=i"
    )
      .then((html) => {
        var companiesList = [];
        let $ = cheerio.load(html);
        $(".row .col-md-4.turtle-family-card").each(async function (
          index,
          element
        ) {
          companiesList[index] = {};
          var header = $(element).find(".family-name").text();
          companiesList[index]["familyName"] = header;
          var image = $(element).find(".turtle-image").attr("src");
          companiesList[index]["turtleImage"] = image;
        });

        console.log(companiesList.length);
        setValue(companiesList);
        const jsonObject = JSON.stringify(companiesList);
        console.log(jsonObject);
      })
      .catch(function (err) {
        console.log("crawl failed");
      });
  }, []);

  const columns = React.useMemo(
    () => [
      {
        Header: "Turtle Family",
        columns: [
          {
            Header: "FamilyName",
            accessor: "familyName",
          },
          {
            Header: "Pic",
            accessor: "turtleImage",
            maxWidth: 90,
            minWidth: 90,
            Cell: ({ cell: { value } }) => (
              <img src={value} width={80} alt="myimg" />
            ),
          },
        ],
      },
    ],
    []
  );

  return (
    <>
      <Table columns={columns} data={names} />
    </>
  );
}

export default PaginationTableComponent;
