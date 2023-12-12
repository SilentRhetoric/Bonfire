import {
  getCoreRowModel,
  createSolidTable,
  flexRender,
  getSortedRowModel,
  RowData,
  CellContext,
} from "@tanstack/solid-table"
import { AssetData } from "solid-algo-wallets"
import { Component, For, createEffect, createMemo, createSignal } from "solid-js"
import { BonfireAssetData } from "../lib/types"
import useBonfire from "../lib/useBonfire"

declare module "@tanstack/solid-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface TableMeta<TData extends RowData> {
    updateData: (rowIndex: number, columnId: string | keyof AssetData, value: unknown) => void
  }
}

const IndeterminateCheckbox: Component<{
  indeterminate: boolean
  checked: boolean
}> = (props) => {
  let ref: HTMLInputElement

  createEffect(() => {
    if (typeof props.indeterminate === "boolean") {
      ref.indeterminate = !props.checked && props.indeterminate
    }
  })

  // const { groupFull, groupOverFull } = useBonfire

  return (
    <input
      type="checkbox"
      ref={(el) => (ref = el)}
      class={"checkbox"}
      name="Select asset"
      aria-label="Select asset"
      // disabled={groupFull() || groupOverFull()}
      {...props}
    />
  )
}

export const ASATable: Component = () => {
  const { accountAssets, setAccountAssets, sorting, setSorting, rowSelection, setRowSelection } =
    useBonfire
  const burnableAsas = createMemo(() => [...accountAssets.filter((a) => a.id > 0 && !a.frozen)])

  // createComputed(() => console.debug("accountAsssets in component: ", accountAssets))

  const columns = [
    {
      id: "select",
      header: (data: {
        table: {
          getIsAllRowsSelected: () => boolean
          getIsSomeRowsSelected: () => boolean
          getToggleAllRowsSelectedHandler: () => unknown
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
          getIsSelected: () => boolean
          getCanSelect: () => boolean
          getIsSomeSelected: () => boolean
          getToggleSelectedHandler: () => unknown
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
        // createComputed(() => console.debug("value: ", value()))

        // When the input is blurred, we'll call our table meta's updateData function
        const onBlur = () => {
          if (0 < value() && value() <= c.row.original.amount) {
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
            class="input input-xs w-32 text-right text-sm"
            type="number"
            max={c.row.original.decimalAmount}
            min={0}
            name="Asset amount"
            aria-label="Asset amount"
          />
        )
      },
    },
    {
      accessorKey: "name",
      cell: (info: { getValue: () => unknown }) => info.getValue(),
      header: "Name",
    },
    {
      accessorKey: "unitName",
      cell: (info: { getValue: () => unknown }) => info.getValue(),
      header: "Unit",
    },
    {
      accessorKey: "id",
      cell: (info: { getValue: () => unknown }) => info.getValue(),
      header: "ID",
    },
  ]

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
        updateData: (rowIndex, columnId: string | keyof AssetData, value: unknown) => {
          console.debug(`Updating row ${rowIndex} column ${columnId} value ${value}`)
          setAccountAssets(
            // This method updates the store but changing one element isn't reactive
            // https://www.solidjs.com/docs/latest/api#arrays-in-stores
            // rowIndex,
            // columnId as keyof BonfireAssetData,
            // value,
            // This method replaces the whole array which makes it reactive
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
    <div class="max-h-[400px] min-w-[200px] overflow-y-auto">
      <table class="table table-pin-rows table-xs">
        <thead class="text-base text-base-content">
          <For each={table().getHeaderGroups()}>
            {(headerGroup) => (
              <tr class="bg-base-200">
                <For each={headerGroup.headers}>
                  {(header) => (
                    <th onClick={header.column.getToggleSortingHandler()}>
                      <div class="hover flex items-center justify-center">
                        {flexRender(header.column.columnDef.header, header.getContext())}{" "}
                        {{
                          asc: (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                              class="h-4 w-4"
                            >
                              <path
                                fill-rule="evenodd"
                                d="M10 18a.75.75 0 01-.75-.75V4.66L7.3 6.76a.75.75 0 11-1.1-1.02l3.25-3.5a.75.75 0 011.1 0l3.25 3.5a.75.75 0 01-1.1 1.02l-1.95-2.1v12.59A.75.75 0 0110 18z"
                                clip-rule="evenodd"
                              />
                            </svg>
                          ),
                          desc: (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                              class="h-4 w-4"
                            >
                              <path
                                fill-rule="evenodd"
                                d="M10 2a.75.75 0 01.75.75v12.59l1.95-2.1a.75.75 0 111.1 1.02l-3.25 3.5a.75.75 0 01-1.1 0l-3.25-3.5a.75.75 0 111.1-1.02l1.95 2.1V2.75A.75.75 0 0110 2z"
                                clip-rule="evenodd"
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
    </div>
  )
}
