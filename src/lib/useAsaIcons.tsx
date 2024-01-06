import { createResource, createRoot } from "solid-js"

interface IAsaList {
  [key: string]: {
    id: string
    decimals?: number
    delete?: boolean
    logo?: { png?: string; svg?: string }
    name?: string
    total_amount?: string
    unit_name?: string
    url?: string
  }
}

function useAsaIcons() {
  const [asaList] = createResource<IAsaList>(getAsaList)

  async function getAsaList() {
    // console.debug("Fetching ASA List")
    const list: IAsaList = await (await fetch("https://asa-list.tinyman.org/assets.json")).json()
    // console.debug("ASA List: ", list)
    return list
  }

  return {
    asaList,
  }
}

export default createRoot(useAsaIcons)
