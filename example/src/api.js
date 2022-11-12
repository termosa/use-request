const data = {
  lastId: 2,
  resources: [
    { id: 1, label: 'First resource' },
    { id: 2, label: 'Second resource' },
  ],
}

/**
 * @param {Function} result
 * @param {number} delay
 */
const simulateRequest = (result, delay = Math.random() * 1e3) =>
  new Promise((resolve) => setTimeout(() => resolve(result()), delay))

const api = {
  get: () => simulateRequest(() => data.resources),
  post: (resource) =>
    simulateRequest(() => {
      const newResource = { ...resource, id: ++data.lastId }
      data.resources.push(newResource)
      return newResource
    }),
  put: (id, resource) =>
    simulateRequest(() => {
      const oldResource = data.resources.find((resource) => resource.id === id)
      if (!oldResource) return undefined

      const updatedResource = { ...resource, id }
      data.resources = data.resources.map((resource) => (resource.id === id ? updatedResource : resource))
      return updatedResource
    }),
  delete: (id) =>
    simulateRequest(() => {
      const { length } = data.resources
      data.resources = data.resources.filter((resource) => resource.id !== id)
      return data.resources.length !== length
    }),
}

export default api
