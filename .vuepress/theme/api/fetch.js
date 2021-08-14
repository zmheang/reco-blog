import { api, rpc, contract } from "./config"
import { formatDate } from "../helpers/utils"
const timeBase = 1628870400

export const pushAction = async (props) => {
  const {
    actor = contract,
    permission = "active",
    action,
    data,
  } = props
  console.log(actor, permission, action, data)
  try {
    const result = await api.transact(
      {
        actions: [
          {
            account: actor,
            name: action,
            authorization: [
              {
                actor,
                permission,
              },
            ],
            data,
          },
        ],
      },
      {
        blocksBehind: 3,
        expireSeconds: 30,
      }
    )
    console.log('获取到结果', result)
    return result
  } catch (error) {
    console.log('错误', error)
    return {}
  }
}

export const getTableData = async (table, pageKey, pageSize) => {
  try {
    const res = await rpc.get_table_rows({
      json: true,
      code: contract,
      scope: contract,
      table,
      limit: pageSize,
      reverse: true,
      key_type: 'i64',
      upper_bound: pageKey,  //索引参数的上限是什么
      index_position: 1  //使用的主索引
    })
    console.log('获取到结果', res)
    return res
  } catch (error) {
    console.log('错误', error)
    return {}
  }
}

export const add = (content) =>
  pushAction({ action: "add", data: { content } })
    .then((res) => {
      return res
    })

export const done = (id) =>
  pushAction({ action: "done", data: { id } })
    .then((res) => {
      return res
    })

export const remove = (id) =>
  pushAction({ action: "remove", data: { id } })
    .then((res) => {
      return res
    })

export const getTableDataList = async (next_key, pageSize) => {
  const res = await getTableData('todotable', next_key, pageSize);
  if (res.rows) {
    let list = []
    res.rows?.filter((item, index) => {
      const itemArr = item.content.split("|")
      let name, time, value;
      if (itemArr.length === 1) {
        name = "中本聪的神秘接班人"
        time = 1
        value = item.content
      } else if (itemArr.length === 2) {
        name = "中本聪的神秘接班人"
        time = parseInt(itemArr[0])
        value = itemArr[1]
      } else {
        name = itemArr[0]
        time = parseInt(itemArr[1])
        value = itemArr[2]
      }
      list[index] = {
        id: item.id,
        value,
        name,
        time: formatDate(new Date((time + timeBase) * 1000)),
        isDone: !!item.is_done
      }
    });
    return {
      more: res.more,
      next_key: res.next_key,
      list: list,
      status: 200
    }
  }
  return {}
}