const {buildSchema} = require('graphql');
/*
*  *** Đây là một loại (type) trong schema, biểu diễn thông tin về người dùng. Loại này có các trường (fields) như _id, name, email, password, status, và post.
*  Mỗi trường có một kiểu dữ liệu và một số kiểu có dấu chấm thanh (như ID!) để đánh dấu rằng trường đó là bắt buộc.
*
* *** input userInputData: Đây là một kiểu dữ liệu đầu vào (input type) để định nghĩa các biến đầu vào cho các truy vấn và mutation (thay đổi dữ liệu)
*  trong schema. Nó có các trường như email, name, và password.
*
*** type RootQuery: Đây là một loại dữ liệu đặc biệt, được sử dụng cho các truy vấn (queries) trong GraphQL.
*  Trong trường hợp này, bạn đang định nghĩa một truy vấn createUser với một biến đầu vào userInput có kiểu dữ liệu là userInputData.

schema: Cuối cùng, bạn đang định nghĩa schema chính của bạn, với phần mutation trỏ đến loại RootQuery.
*  Điều này có nghĩa rằng trong schema này, bạn sẽ có các mutation (thay đổi dữ liệu) được định nghĩa trong RootQuery
* */
module.exports = buildSchema(`
    type Post{
        _id: ID!
        title: String!
        content: String!
        imageUrl: String!
        creator: User!
        createdAt: String!
        updatedAt: String!
    }
    
    type User
    {
        _id: ID!
        name: String!
        email: String!
        password: String!
        status: String!
        post:[Post!]!
    }
    
    type AuthData{
        token: String!
        userId: String!
    }
    
    type PostData{
        posts: [Post!]!
        totalPosts: Int!
        }
    
    input userInputData
    {
        email: String!
        name: String!
        password: String!
    }
    
    input PostInputData
    {
        title: String!
        content: String!
        imageUrl: String!
    }
    
    type RootQuery
    {
        login(email: String!, password: String!): AuthData!
        posts(page:Int): PostData!
        post(id: ID!): Post!
        user: User!
    }
    
    type RootMutation
    {
        createUser(userInput: userInputData): User!
        createPost(postInput: PostInputData): Post!
        updatePost(id: ID!, postInput: PostInputData): Post!
        deletePost(id: ID!): Boolean
        updateStatus(status: String!): User!
    }
    
    schema { 
        query: RootQuery
        mutation: RootMutation
    }
    
`);