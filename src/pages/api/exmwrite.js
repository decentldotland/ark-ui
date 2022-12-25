import axios from "axios"
import { EXM_ADDRESS, EXM_WRITE_URL, EXM_TOKEN } from '../../utils/constants'

export default async function handler(req, res) {
  try {
    const data = await axios.post(EXM_WRITE_URL + EXM_TOKEN, {
      functionId: EXM_ADDRESS,
      inputs: [{
        "input": JSON.stringify({
          ...req.body
        }),
        "tags": [
          {
            name: "Protocol-Name",
            value: "Ark-Network"
          },
          {
            name: "Protocol-Action",
            value: "Link-Identity"
          }
        ]
      }],
    }, {})
    res.status(200).json(data.data)
  } catch (error) {
    console.error(error)
    return res.status(error.status || 500).end(error.message)
  }
}
