const authorModel = require('../model/authorModel')
const validator = require('../validator/validator.js');
const blogModel = require('../model/blogModel.js');
// const middleware=require("../middleware/auth.js");



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
        let updatedBlog = await blogModel.findOneAndUpdate({ _id: blogId },
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
        if (!blog) return res.status(404).send({ status: false, msg: "Blog document does not exists" })
        //------------------------------------------Authorisation---------------------------------------------------------------//     
        let authorLoggedId = req.authorLoggedIn;
        if (blog.authorId != authorLoggedId) {
            return res.status(403).send({ status: false, msg: "Unauthorized" })
        }
        //--------------------------------------------------------------------------------------------------------------------//

        if (blog.isDeleted == true) return res.status(404).send({ status: false, msg: "Blog document is already deleted" })
        res.status(200).send({ msg: "Deleted" })
    } catch (error) {
        res.status(500).send({ msg: error.message })
    }
}



//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>Question-6>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

const deleteByQuery = async (req, res) => {
    try {

          let query = req.query;
          let blogId = req.params.blogId
          if (Object.keys(query).length==0){
              return res.status(401).send({status:false, msg:"query is mandatory"})
            }
            const a= await blogModel.find(query)
            if (a.length==0){
             return res.status(404).send({status : false, msg: "data not found"})
            }
            const b=await blogModel.findOne({ _id: blogId })
            if (b.isDeleted==true){
                return res.status(401).send({status:false,msg:"data is already deleted"})
            }

            //authorization
            
            // let availableBlog = await blogModel.findById(blogId);

            // if (!availableBlog) {
            //     return res.status(404).send({ status: false, msg: "Blog Not Found" });
            // }
            // if (availableBlog.isDeleted == true) {
            //     return res.status(404).send({ status: false, msg: "Blog already deleted" });
            // }
            
            // let authorLoggedId = req.authorLoggedIn;

            // if (availableBlog.authorId != authorLoggedId) {
            //     return res.status(403).send({ status: false, msg: "Unauthorized" })
            // }


            // let authorToBeModified = req.authorId;
            // let authorLoggedin = decodedToken.authorId;
            // if (authorToBeModified != authorLoggedin) {
            //   return res.status(403).send({status: false,msg: "author loggedin not allowed to modify changes"});
            // }

            //uncomment this

      if (query) {

        const deletedBlogByQuery = await blogModel.updateMany(
          {
            $or: [
              { authorId: query.authorId },
              { category: query.category },
              { tags: query.tags },
              { subcategory: query.subcategory },
              { isPublished: query.isPublished },
            ]
          },
          { $set: { isDeleted: true, deletedAt: Date.now() } }
        );
        if (deletedBlogByQuery.modifiedCount == 0) {
          return res.status(404).send({ status: false, msg: "Alredy deleted" });
        }
        return res
          .status(200)
          .send({ status: true, msg: "Blogs are deleted successfully." });
      }
    } catch (err) {
      console.log(err)
      res.status(500).send({ msg: err.message });
    }
  };

// const deleteByQuery = async function (req, res) {
//     try {
//         let query = req.query;

//         if (query) {
//             const deletedBlogByQuery = await blogModel.updateMany({
//                 $or: [{ authorId: query.authorId }, { category: query.category },
//                 { tags: query.tags }, { subcategory: query.subcategory }, { isPublished: query.isPublished }]
//             },
//                 { $set: { isDeleted: true, deletedAt: Date.now() } })
//             console.log(deletedBlogByQuery);

//             if (deletedBlogByQuery.modifiedCount === 0) {
//                 return res.status(404).send({ status: false, msg: "Blogs not found" })
//             }

//             return res.status(200).send({ status: true, msg: "Blogs are deleted successfully." })

//         }
//     } catch (err) { res.status(500).send({ msg: err.message }) }
// };


//...................................................................................................................//

// const deleteByQuery = async (req, res) => {
//     try{
//     let data = req.query;
//     let filterQuery = {isDeleted:false,deletedAt:null}
//     const authorIdFromToken = req.authorId;
//     let { category, authorId, tags, subcategory, isPublished } = data;
    
//     if (Object.keys(data) == 0){
//       return res.status(400).send({ msg: "InValid request" });
//     }
//     if(isValid(category)){
//       filterQuery['category'] = category;
//     }
//     if(isValid(tags)){
//       const tagsArray = tags.trim().split(',').map(tag=>tag.trim())
//       filterQuery['tags'] = {$all: tagsArray};
//     }
//     if(isValid(subcategory)){
//       const subcatArray = subcategory.trim().split(',').map(subcat=>subcat.trim())
//       filterQuery['subcateg'] = {$all: subcatArray};
//     }
//     if(isValid(isPublished)){
//       filterQuery['isPublished'] = isPublished;
//     }
//     if(isValid(authorId)){
//       filterQuery['authorId'] = authorId;
//     }
//     let blog = await blogModel.find(filterQuery)
//     if(Array.isArray(blog) && blog.length===0){
//       res.status(404).send({status:false, msg:"No matching blogs found"});
//     }
//     const blogsToDelete = blog.map(blog=>{
//       if(blog.authorId.toString()===authorIdFromToken) return blog._id
//     })
//     if(blogsToDelete.length===0){
//       res.status(404).send({status:false, msg:"no matching blogs found"})
//     }
//     await blogModel.updateMany({_id: {$in: blogsToDelete }},{$set:{isDeleted:true, deletedAt:Date.now()}})
//     res.status(200).send({status:true, msg:"blog deleted successfully"})
  
//   }catch(err){
//     return res.status(500).send({status:false, msg: err.message});
//   }
//   }


module.exports.createBlog = createBlog;
module.exports.updateBlogs = updateBlogs;
module.exports.getBlog = getBlog;
module.exports.deleteBlog = deleteBlog;
module.exports.deleteByQuery = deleteByQuery;
