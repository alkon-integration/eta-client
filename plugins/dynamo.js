const { DynamoDBClient, GetItemCommand } = require('@aws-sdk/client-dynamodb')
const { unmarshall, marshall } = require('@aws-sdk/util-dynamodb')
const ddb = new DynamoDBClient({
  region: 'sa-east-1',
  credentials: {
    accessKeyId: process.env.accessKeyId,
    secretAccessKey: process.env.secretAccessKey
  }
})

const TableName = 'alkon_statepolpaico_in'

export default function (app, inject) {
  const dynamo = {
    get: (idgps) => {
      return ddb.send(new GetItemCommand({
        TableName,
        Key: marshall({ idgps })
      })).then(r => unmarshall(r.Item))
    }
  }
  inject('dynamo', dynamo)
}
