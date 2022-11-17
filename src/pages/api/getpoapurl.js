import { POAPS } from '../../utils/constants'

export default async function handler(req, res) {
  try {
    const parsed = JSON.parse(POAPS)
    res.status(200).json(parsed[req.body.arweave_address])
  } catch (error) {
    console.error(error)
    return res.status(error.status || 500).end(error.message)
  }
}