// import {RequestMapping} from '../decorators/requestMapping';
// import {httpGet, httpPost} from '../decorators/http-methods';
// import {path} from '../decorators/path';
import { Path, GET, POST, PUT, DELETE, BodyParam, CtxParam, PathParam, QueryParam } from 'iwinter';
import Post from '../models/Post';
import Comment from '../models/Comment';
import Label from '../models/Label';
import { userLoginAuth } from '../auth';
import { buildResponse } from '../utils';
import config from '../config';

let { page: { limit } } = config;

export interface QueryAll {
    currentPage: number;
    type: string;
}

@Path('/api/posts')
class PostController {

    /**
     * 查询所有文章
     */
    @GET
    @Path('/')
    async getAllPosts(@QueryParam('query') query: QueryAll) {
        //硬编码过滤掉 registor 的文章
        let { currentPage, type } = query;
        let skip = (currentPage - 1) * limit;
        let queryCondition: any = { postStatus: 'Publish', userName: { $ne: 'registor' } };
        if(type) {
            queryCondition.type = type;
        }
        let totalCount = await Post.count(queryCondition);
        let posts = await Post.find(queryCondition)
            .sort('-publishDate')
            .limit(limit)
            .skip(skip);
        let postList = await Promise.all(posts.map(async (post) => {
            let commentsByPostId = await Comment.findByPostId(post['_id']);
            post['comments'] = commentsByPostId.map(comment => {
                comment['_id'];
            });
            return post;
        }));
        return buildResponse(null, { posts: postList, totalCount });
    }

    /**
     * 查询当前登录用户的文章
     * @param ctx 
     */
    @GET
    @Path('/get-by-user', userLoginAuth)
    async getPostsByUser(@CtxParam('ctx') ctx: any, @QueryParam('query') query: QueryAll) {
        let { userId } = ctx.session.userInfo;
        let { currentPage } = query;
        let skip = (currentPage - 1) * limit;
        let queryCondition = { userId, postStatus: { $in: ['Draft', 'Publish'] } };
        let totalCount = await Post.count(queryCondition);
        let posts = await Post.find(queryCondition)
            .sort('-publishDate')
            .limit(limit)
            .skip(skip);
        let postList = await Promise.all(posts.map(async (post) => {
            let commentsByPostId = await Comment.findByPostId(post['_id']);
            post['comments'] = commentsByPostId.map(comment => {
                comment['_id'];
            });
            return post;
        }));
        let labels = await Label.findByUserId(userId);

        return buildResponse(null, { posts: postList, labels, totalCount, currentPage });
    }

    /**
     * 根据postId查询指定博客内容
     */
    @GET
    @Path('/:postId')
    async getPostById(@PathParam('postId') postId: string) {
        let [post, comments] = await Promise.all([Post.findById(postId), Comment.findByPostId(postId)]);
        //更新访问量数据
        post = await Post.findByIdAndUpdate(postId, { $set: { count: post.count + 1 } }, { new: true });
        let labels = await Promise.all(post.labels.map(async (labelId) => {
            let label = await Label.findById(labelId);
            return label;
        }))
        post.comments = comments;
        post.labels = labels;

        return buildResponse(null, post);
    }

    /**
     * 新增博客文章
     */
    @POST
    @Path('/', userLoginAuth)
    async addPost(@CtxParam('ctx') ctx: any, @BodyParam('post') post: any) {
        let { userId, username } = ctx.session.userInfo;
        //设置创建人 和 创建时间
        Object.assign(post, {
            userId,
            userName: username,
            publishDate: new Date()
        });
        let newPost = new Post(post);
        let result = await newPost.save();
        return buildResponse(null, result);
    }

    /**
     * 修改博客文章
     */
    @PUT
    @Path('/:postId', userLoginAuth)
    async modifyPost(@PathParam('postId') postId: any, @BodyParam('post') post: any) {
        //如果更新发布时间，则重置 publishData 为当前时间
        if (post.updateDate) {
            post.publishDate = new Date();
        }
        let result = await Post.findByIdAndUpdate(postId, { $set: post }, { new: true });
        return buildResponse(null, result);
    }

    /**
     * 删除博客文章,则 置博客的状态为： postStatus: Invaild
     */
    @DELETE
    @Path('/:postId', userLoginAuth)
    async deletePost(@PathParam('postId') postId: any) {
        let result = await Post.findByIdAndUpdate(postId, { $set: { postStatus: 'Invaild' } }, { new: true });
        return buildResponse(null, { _id: postId });
    }
}

export default PostController;