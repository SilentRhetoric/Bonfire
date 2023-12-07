import {
  getCoreRowModel,
  ColumnDef,
  createSolidTable,
  flexRender,
  SortingState,
  getSortedRowModel,
  RowData,
} from "@tanstack/solid-table"
import { AssetData } from "solid-algo-wallets"
import { Component, For, createComputed, createEffect, createMemo, createSignal } from "solid-js"
import { createStore } from "solid-js/store"
import { displayAssetAmount, makeIntegerAmount } from "../lib/utilities"

declare module "@tanstack/solid-table" {
  // eslint-disable-next-line no-unused-vars
  interface TableMeta<TData extends RowData> {
    // eslint-disable-next-line no-unused-vars
    updateData: (rowIndex: number, columnId: keyof AssetData, value: unknown) => void
  }
}

// Give our default column cell renderer editing superpowers!
const defaultColumn: Partial<ColumnDef<AssetData>> = {
  // eslint-disable-next-line solid/no-destructure
  cell: ({ getValue, row: { index, original }, column: { id }, table }) => {
    // cell: (c) => {
    const initialValue = getValue()
    // We need to keep and update the state of the cell normally
    const [value, setValue] = createSignal(initialValue)
    createComputed(() => console.debug("value: ", value()))

    // When the input is blurred, we'll call our table meta's updateData function
    const onBlur = () => {
      const intAmt = makeIntegerAmount(Number(value()), original)
      table.options.meta?.updateData(index, id, intAmt)
    }

    const onChange = (
      e: Event & {
        currentTarget: HTMLInputElement
        target: HTMLInputElement
      },
    ) => {
      setValue(e.target.value)
      // const intAmt = makeIntegerAmount(Number(value()), original)
      // table.options.meta?.updateData(index, id, intAmt)
    }

    // If the initialValue is changed external, sync it up with our state
    createEffect(() => {
      setValue(initialValue)
    })

    return (
      <input
        value={displayAssetAmount(original)}
        // onChange={(e) => setValue(e.target.value)}
        onChange={onChange}
        onBlur={onBlur}
        class="input"
      />
    )
  },
}

function IndeterminateCheckbox(props: any) {
  let ref: HTMLInputElement

  createEffect(() => {
    if (typeof props.indeterminate === "boolean") {
      ref.indeterminate = !props.checked && props.indeterminate
    }
  })

  return (
    <input
      type="checkbox"
      ref={(el) => (ref = el)}
      class={"checkbox"}
      {...props}
    />
  )
}

export const ASATable: Component<{ assets: AssetData[] }> = (props) => {
  const [sorting, setSorting] = createSignal<SortingState>([])
  const [rowSelection, setRowSelection] = createSignal({})

  const columns = [
    {
      id: "select",
      header: (data: {
        table: {
          getIsAllRowsSelected: () => any
          getIsSomeRowsSelected: () => any
          getToggleAllRowsSelectedHandler: () => any
        }
      }) => (
        <IndeterminateCheckbox
          {...{
            checked: data.table.getIsAllRowsSelected(),
            indeterminate: data.table.getIsSomeRowsSelected(),
            onChange: data.table.getToggleAllRowsSelectedHandler(),
          }}
        />
      ),
      cell: (data: {
        row: {
          getIsSelected: () => any
          getCanSelect: () => any
          getIsSomeSelected: () => any
          getToggleSelectedHandler: () => any
        }
      }) => (
        <IndeterminateCheckbox
          {...{
            checked: data.row.getIsSelected(),
            disabled: !data.row.getCanSelect(),
            indeterminate: data.row.getIsSomeSelected(),
            onChange: data.row.getToggleSelectedHandler(),
          }}
        />
      ),
    },
    {
      accessorKey: "amount",
      // cell: (info: { row: { original: AssetData } }) => displayAssetAmount(info.row.original),
    },
    { accessorKey: "id", cell: (info: { getValue: () => any }) => info.getValue() },
    { accessorKey: "name", cell: (info: { getValue: () => any }) => info.getValue() },
    {
      accessorKey: "unitName",
      cell: (info: { getValue: () => any }) => info.getValue(),
    },
  ]

  const table = createMemo(() => {
    const [burnableAssets, setBurnableAssets] = createStore(props.assets)
    createComputed(() => console.debug("Store updated: ", ...burnableAssets))

    return createSolidTable({
      // get data() {
      //   return burnableAssets()
      // },
      data: burnableAssets,
      columns,
      defaultColumn,
      getCoreRowModel: getCoreRowModel(),
      enableRowSelection: true,
      enableMultiRowSelection: true,
      onSortingChange: setSorting,
      getSortedRowModel: getSortedRowModel(),
      state: {
        get sorting() {
          return sorting()
        },
        get rowSelection() {
          return rowSelection()
        },
      },
      onRowSelectionChange: setRowSelection,
      // Provide our updateData function to our table meta
      meta: {
        updateData: (rowIndex, columnId: keyof AssetData, value: any) => {
          console.debug(`Updating value ${value}`)
          setBurnableAssets(
            // rowIndex,
            // columnId,
            // value,
            (prev) => {
              console.debug("prev: ", prev)
              let modified = []
              modified = prev.map((row, index) => {
                if (index === rowIndex) {
                  return {
                    ...prev[rowIndex]!,
                    [columnId]: value,
                  }
                }
                return row
              })
              console.debug("modified: ", modified)
              return modified
            },
          )
        },
      },
    })
  })

  return (
    <div class="overflow-x-auto">
      <table class="table table-xs">
        <thead class="text text-lg text-base-content">
          <For each={table().getHeaderGroups()}>
            {(headerGroup) => (
              <tr>
                <For each={headerGroup.headers}>
                  {(header) => (
                    <th onClick={header.column.getToggleSortingHandler()}>
                      <div class="hover flex">
                        {flexRender(header.column.columnDef.header, header.getContext())}{" "}
                        {{
                          asc: (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke-width="1.5"
                              stroke="currentColor"
                              class="h-6 w-6"
                            >
                              <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                d="M8.25 6.75L12 3m0 0l3.75 3.75M12 3v18"
                              />
                            </svg>
                          ),
                          desc: (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke-width="1.5"
                              stroke="currentColor"
                              class="h-6 w-6"
                            >
                              <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                d="M15.75 17.25L12 21m0 0l-3.75-3.75M12 21V3"
                              />
                            </svg>
                          ),
                        }[header.column.getIsSorted() as string] ?? null}
                      </div>
                    </th>
                  )}
                </For>
              </tr>
            )}
          </For>
        </thead>
        <tbody>
          <For each={table().getRowModel().rows}>
            {(row) => (
              <tr class="hover">
                <For each={row.getVisibleCells()}>
                  {(cell) => <td>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>}
                </For>
              </tr>
            )}
          </For>
        </tbody>
      </table>
      {/* <p>{JSON.stringify(props.assets())}</p> */}
      {/* <div>{Object.keys(rowSelection()).length} Rows Selected</div>
      <button
        class="btn m-2 p-2"
        onClick={() => console.info("rowSelection", rowSelection())}
      >
        Log `rowSelection` state
      </button>
      <button
        class="btn m-2 p-2"
        onClick={() =>
          console.info("table.getSelectedRowModel().flatRows", table.getSelectedRowModel().flatRows)
        }
      >
        Log table.getSelectedRowModel().flatRows
      </button> */}
    </div>
  )
}
