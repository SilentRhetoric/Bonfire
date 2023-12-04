import {
  getCoreRowModel,
  ColumnDef,
  createSolidTable,
  flexRender,
  SortingState,
  getSortedRowModel,
} from "@tanstack/solid-table"
import { AssetData } from "solid-algo-wallets"
import { Accessor, Component, For, createEffect, createMemo, createSignal } from "solid-js"

function IndeterminateCheckbox(props) {
  let ref

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

export const ASATable: Component<{ assets: Accessor<AssetData[]> }> = (props) => {
  const [sorting, setSorting] = createSignal<SortingState>([])
  const [rowSelection, setRowSelection] = createSignal({})

  const columns: ColumnDef<AssetData>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <IndeterminateCheckbox
          {...{
            checked: table.getIsAllRowsSelected(),
            indeterminate: table.getIsSomeRowsSelected(),
            onChange: table.getToggleAllRowsSelectedHandler(),
          }}
        />
      ),
      cell: ({ row }) => (
        <IndeterminateCheckbox
          {...{
            checked: row.getIsSelected(),
            disabled: !row.getCanSelect(),
            indeterminate: row.getIsSomeSelected(),
            onChange: row.getToggleSelectedHandler(),
          }}
        />
      ),
    },
    { accessorKey: "amount", cell: (info) => info.getValue(), footer: (props) => props.column.id },
    { accessorKey: "id", cell: (info) => info.getValue(), footer: (props) => props.column.id },
    { accessorKey: "name", cell: (info) => info.getValue(), footer: (props) => props.column.id },
    {
      accessorKey: "unitName",
      cell: (info) => info.getValue(),
      footer: (props) => props.column.id,
    },
  ]

  // Frozen assets aren't burnable in the Bonfire so we remove them
  const burnableAssets = createMemo(() => props.assets().filter((asset) => !asset.frozen))

  const table = createSolidTable({
    get data() {
      return burnableAssets()
    },
    columns,
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
    enableSubRowSelection: true,
    onRowSelectionChange: setRowSelection,
  })

  return (
    <div class="overflow-x-auto">
      <table class="table table-xs">
        <thead class="text text-lg text-base-content">
          <For each={table.getHeaderGroups()}>
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
          <For each={table.getRowModel().rows}>
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
