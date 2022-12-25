import axios from "axios"
import { EXM_READ_URL, EXM_ADDRESS } from '../../utils/constants'

export default async function handler(req, res) {
  try {
    const data = await axios.get(EXM_READ_URL + EXM_ADDRESS)
    res.status(200).json(data.data)
  } catch (error) {
    console.error(error)
    return res.status(error.status || 500).end(error.message)
  }
}
