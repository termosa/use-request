const data = {
  lastId: 2,
  resources: [
    { id: 1, label: 'First resource' },
    { id: 2, label: 'Second resource' },
  ],
  liked: false,
  likeCount: 42,
  todos: ['Buy groceries', 'Walk the dog'],
  users: {
    1: { id: 1, name: 'Alice Johnson', email: 'alice@example.com' },
    2: { id: 2, name: 'Bob Smith', email: 'bob@example.com' },
    3: { id: 3, name: 'Carol White', email: 'carol@example.com' },
  },
  fruits: ['Apple', 'Apricot', 'Avocado', 'Banana', 'Blueberry', 'Cherry', 'Coconut', 'Date', 'Elderberry', 'Fig', 'Grape', 'Guava', 'Kiwi', 'Lemon', 'Lime', 'Mango', 'Melon', 'Nectarine', 'Orange', 'Papaya', 'Peach', 'Pear', 'Pineapple', 'Plum', 'Raspberry', 'Strawberry', 'Watermelon'],
}

/**
 * @param {Function} result
 * @param {number} delay
 */
const simulateRequest = (result, delay = Math.random() * 1e3) =>
  new Promise((resolve) => setTimeout(() => resolve(result()), delay))

const simulateFailure = (error, delay = Math.random() * 1e3) =>
  new Promise((_, reject) => setTimeout(() => reject(error), delay))

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
  getLikeStatus: () => simulateRequest(() => ({ liked: data.liked, count: data.likeCount })),
  toggleLike: (liked) =>
    simulateRequest(() => {
      data.liked = liked
      data.likeCount += liked ? 1 : -1
      return { liked: data.liked, count: data.likeCount }
    }, 800 + Math.random() * 700),
  getUser: (id) => simulateRequest(() => data.users[id], 600 + Math.random() * 600),
  getTodos: () => simulateRequest(() => [...data.todos]),
  addTodo: (text) =>
    simulateRequest(() => {
      data.todos.push(text)
      return [...data.todos]
    }),
  addTodoFail: () => simulateFailure('Server error: could not save', 800),
  search: (query) =>
    simulateRequest(
      () => data.fruits.filter((f) => f.toLowerCase().includes(query.toLowerCase())),
      200 + Math.random() * 1300
    ),
  getPage: (page) => {
    const pageSize = 5
    const start = page * pageSize
    return simulateRequest(
      () => data.fruits.slice(start, start + pageSize),
      300 + Math.random() * 500
    )
  },
}

export default api
