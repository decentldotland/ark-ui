import axios from "axios"
import { EXM_ADDRESS } from '../../utils/constants'

export default async function handler(req, res) {
  try {
    const data = await axios.get(`https://api.exm.dev/read/${EXM_ADDRESS}`)
    res.status(200).json(data.data)
  } catch (error) {
    console.error(error)
    return res.status(error.status || 500).end(error.message)
  }
}