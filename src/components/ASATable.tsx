import {
  getCoreRowModel,
  // ColumnDef,
  createSolidTable,
  flexRender,
  SortingState,
  getSortedRowModel,
  RowData,
  CellContext,
} from "@tanstack/solid-table"
import { AssetData } from "solid-algo-wallets"
import { Component, For, createComputed, createEffect, createMemo, createSignal } from "solid-js"
import { BonfireAssetData } from "../lib/types"
import useAssets from "../lib/useAssets"

declare module "@tanstack/solid-table" {
  // eslint-disable-next-line no-unused-vars
  interface TableMeta<TData extends RowData> {
    // eslint-disable-next-line no-unused-vars
    updateData: (rowIndex: number, columnId: string | keyof AssetData, value: unknown) => void
  }
}

// Give our default column cell renderer editing superpowers!
// This is used to make the amount field into ane ditable number type text input
// Other columns don't use this; cell rendering is overriden in the columns array
// const defaultColumn: Partial<ColumnDef<BonfireAssetData>> = {
//   // eslint-disable-next-line solid/no-destructure
//   // cell: ({ getValue, row: { index, original }, column: { id }, table }) => {
//   cell: (c) => {
//     // cell: (c) => {
//     const initialValue = c.getValue() as number
//     // We need to keep and update the state of the cell normally
//     const [value, setValue] = createSignal<number>(initialValue)
//     createComputed(() => console.debug("value: ", value()))

//     // When the input is blurred, we'll call our table meta's updateData function
//     const onBlur = () => {
//       if (0 < value() && value() <= c.row.original.decimalAmount) {
//         c.table.options.meta?.updateData(c.row.index, c.column.id, value())
//       } else {
//         c.table.options.meta?.updateData(c.row.index, c.column.id, c.row.original.decimalAmount)
//         setValue(c.row.original.decimalAmount)
//       }
//     }

//     const onChange = (
//       e: Event & {
//         currentTarget: HTMLInputElement
//         target: HTMLInputElement
//       },
//     ) => {
//       setValue(Number(e.target.value))
//     }

//     // If the initialValue is changed external, sync it up with our state
//     createEffect(() => {
//       setValue(initialValue)
//     })

//     return (
//       <input
//         value={value()}
//         onChange={onChange}
//         onBlur={onBlur}
//         class="input w-40 text-right"
//         type="number"
//         max={c.row.original.decimalAmount}
//         min={0}
//       />
//     )
//   },
// }

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

export const ASATable: Component<{ assets: BonfireAssetData[] }> = (props) => {
  const { accountAssets, setAccountAssets } = useAssets
  const [sorting, setSorting] = createSignal<SortingState>([])
  const [rowSelection, setRowSelection] = createSignal({})

  createComputed(() => console.debug("accountAsssets in component: ", accountAssets))
  createComputed(() => console.debug(rowSelection()))

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
      accessorKey: "decimalAmount",
      header: "Amount",
      cell: (c: CellContext<BonfireAssetData, unknown>) => {
        // eslint-disable-next-line solid/reactivity
        const initialValue = c.getValue() as number
        // We need to keep and update the state of the cell normally
        const [value, setValue] = createSignal<number>(initialValue)
        createComputed(() => console.debug("value: ", value()))

        // When the input is blurred, we'll call our table meta's updateData function
        const onBlur = () => {
          if (0 < value() && value() <= c.row.original.decimalAmount) {
            c.table.options.meta?.updateData(c.row.index, c.column.id, value())
          } else {
            c.table.options.meta?.updateData(c.row.index, c.column.id, c.row.original.decimalAmount)
            setValue(c.row.original.decimalAmount)
          }
        }

        const onChange = (
          e: Event & {
            currentTarget: HTMLInputElement
            target: HTMLInputElement
          },
        ) => {
          setValue(Number(e.target.value))
        }

        // If the initialValue is changed external, sync it up with our state
        createEffect(() => {
          setValue(initialValue)
        })

        return (
          <input
            value={value()}
            onChange={onChange}
            onBlur={onBlur}
            class="input w-40 text-right"
            type="number"
            max={c.row.original.decimalAmount}
            min={0}
          />
        )
      },
    },
    {
      accessorKey: "name",
      cell: (info: { getValue: () => any }) => info.getValue(),
      header: "Name",
    },
    {
      accessorKey: "unitName",
      cell: (info: { getValue: () => any }) => info.getValue(),
      header: "Unit",
    },
    { accessorKey: "id", cell: (info: { getValue: () => any }) => info.getValue(), header: "ID" },
  ]

  const burnableAsas = createMemo(() => [...props.assets].filter((a) => a.id > 0))

  const table = createMemo(() => {
    return createSolidTable({
      debugTable: true,
      data: burnableAsas(),
      columns,
      // defaultColumn,
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
        updateData: (rowIndex, columnId: string | keyof AssetData, value: any) => {
          console.debug(`Updating row ${rowIndex} column ${columnId} value ${value}`)
          setAccountAssets(
            // This method updates the store but changing one element isn't reactive
            rowIndex,
            columnId as keyof BonfireAssetData,
            value,
            // This method replaces the whole array which makes it reactive
            // (prev) => {
            //   console.debug("prev: ", prev)
            //   let modified = []
            //   modified = prev.map((row, index) => {
            //     if (index === rowIndex) {
            //       return {
            //         ...prev[rowIndex]!,
            //         [columnId]: value,
            //       }
            //     }
            //     return row
            //   })
            //   console.debug("modified: ", modified)
            //   return modified
            // },
          )
          console.debug("accountssets: ", accountAssets)
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
        class="btn btn-ghost m-2 p-2"
        onClick={() => console.info("rowSelection", rowSelection())}
      >
        Log `rowSelection` state
      </button>
      <button
        class="btn btn-ghost m-2 p-2"
        onClick={() =>
          console.info("table.getSelectedRowModel().flatRows", table.getSelectedRowModel().flatRows)
        }
      >
        Log table.getSelectedRowModel().flatRows
      </button> */}
    </div>
  )
}
