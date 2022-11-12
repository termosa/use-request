import useRequest from 'use-request'
import api from './api'

export { UseRequestStatus } from 'use-request'

const useResources = () => {
  const { execute: reload, value: resources, status } = useRequest(api.get, [])
  const { execute: create } = useRequest((resource) => api.post(resource).then(reload))
  const { execute: remove } = useRequest((id) => api.delete(id).then(reload))

  return { resources, status, create, remove }
}

export default useResources
