const authorModel = require('../model/authorModel')
const validator = require('../validator/validator.js');
const blogModel = require('../model/blogModel.js');




//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>Question-2>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>



const createBlog = async function (req, res) {
    try {
        let data = req.body
        let author = data.authorId
        let validation = await authorModel.findById(author)
        if (!validation) {
            res.status(400).send({ status: false, msg: " author is not present" })
        }
        if (data.isPublished) data.publishedAt = new Date()
        if (data.isDeleted) data.deletedAt = new Date()

        let savedData = await blogModel.create(data);
        res.status(201).send({ status: true, msg: savedData })
    } catch (err) {
        res.status(500).send({ msg: err.message })
    }
}



//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>Question-3>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>



const getBlog = async function (req, res) {
    try {
        const queries = req.query;
        if (!validator.isValidRequestBody(queries)) {
            let data = await blogModel.find({ isDeleted: false, isPublished: true });
            if (data.length == 0) {
                return res.status(404).send({ status: "false", msg: "Sorry,Data not Found." })
            } else {
                return res.status(200).send({ status: true, msg: data });
            }
        } else {
            let data1 = await blogModel.find({
                $or: [{ authorId: queries.authorId }, { category: queries.category },
                { tags: queries.tags }, { subcategory: queries.subcategory }]
            }).find({ isDeleted: false, isPublished: true })
            if (data1.length == 0) {
                return res.status(404).send({ status: "false", msg: "Sorry,Data not Found." })
            } else {
                return res.status(200).send({ status: true, msg: data1 });
            }
        }
    } catch (error) {
        return res.status(500).send({ msg: error.message })
    }
}



//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>Question-4>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>



const updateBlogs = async function (req, res) {
    try {
        let blogId = req.params.blogId;
        if (Object.keys(blogId).length == 0) {
            return res.status(400).send({ status: false, msg: "BlogId is required" });
        }
        let availableBlog = await blogModel.findById(blogId);

        if (!availableBlog) {
            return res.status(404).send({ status: false, msg: "Blog Not Found" });
        }
        if (availableBlog.isDeleted == true) {
            return res.status(404).send({ status: false, msg: "Blog already deleted" });
        }
//------------------------------------------Authorisation---------------------------------------------------------------//     
        let authorLoggedId = req.authorLoggedIn;
        if (availableBlog.authorId != authorLoggedId) {
            return res.status(403).send({ status: false, msg: "Unauthorized" })
        }
//--------------------------------------------------------------------------------------------------------------------//
        let data = req.body;
        if (Object.keys(data).length == 0) {
            return res.status(400).send({ message: "Plesae Enter the data for Updation" })
        }
        let updatedBlog = await blogModel.findOneAndUpdate({ _id: blogId, isDeleted: false },
            {
                $set: { isPublished: true, publishedAt: new Date() },
                $push: { tags: data.tags, subcategory: data.subcategory }
            }, { new: true })

        return res.status(200).send({ status: true, data: updatedBlog });

    } catch (err) { res.status(500).send({ status: false, msg: err.message }) }
};




//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>Question-5>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>




const deleteBlog = async function (req, res) {
    try {
        let blogId = req.params.blogId
        let blog = await blogModel.findById(blogId)
        let data = blog.isDeleted
        if (!blog) return res.status(404).send({ status: false, msg: "Blog does not exists" })
        if (data == true) return res.status(404).send({ status: false, msg: "blog document doesn't exists" })
        res.status(200).send({ msg: deleted })
        //------------------------------------------Authorisation---------------------------------------------------------------//
        let availableBlog = await blogModel.findById(blogId);     
        let authorLoggedId = req.authorLoggedIn;
        if (availableBlog.authorId != authorLoggedId) {
            return res.status(403).send({ status: false, msg: "Unauthorized" })
            
        }
//--------------------------------------------------------------------------------------------------------------------//
        let deletedBlog = await blogModel.findOneAndUpdate({ _id: blogId, isDeleted: false },
            {
                $set: { isDeleted: true, deletedAt: new Date() }
            }, { new: true })

        return res.status(200).send({ status: true, data: deletedBlog });
        
        
    } catch (error) {
        res.status(500).send({ msg: error.message })
    }
}



//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>Question-6>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>



const deleteByQuery = async function (req, res) {
    try {
        const query = req.query;

        if (query) {
            const deletedBlogByQuery = await blogModel.updateMany({
                $or: [{ authorId: query.authorId }, { category: query.category },
                { tags: query.tags }, { subcategory: query.subcategory }, { isPublished: query.isPublished }]
            },
                { $set: { isDeleted: true, deletedAt: Date.now() } })
            console.log(deletedBlogByQuery);

            if (deletedBlogByQuery.modifiedCount === 0) {
                return res.status(404).send({ status: false, msg: "Blogs not found" })
            }

            return res.status(200).send({ status: true, msg: "Blogs are deleted successfully." })

        }
    } catch (err) { res.status(500).send({ msg: err.message }) }
};


//...................................................................................................................//


module.exports.createBlog = createBlog;
module.exports.updateBlogs = updateBlogs;
module.exports.getBlog = getBlog;
module.exports.deleteBlog = deleteBlog;
module.exports.deleteByQuery = deleteByQuery;
