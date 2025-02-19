const wishlistSchema = require('../../model/wishlistSchema')
const productSchema = require('../../model/productSchema')
const cartSchema = require('../../model/cartSchema')

const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;


// --------------------------------- wishlist page -------------------------------

const wishlistpage = async(req,res)=>{
    try{
        if (!req.session.user) {
            req.flash('error', "User is Not Found , Please Login Again"  )
            return res.redirect('/login');
        }
        const wishlist = await wishlistSchema.findOne({ userID: req.session.user }).populate('products.productID')
        if(wishlist){
            res.render('user/wishlist',{title : "Wishlist" ,products: wishlist.products ,  user: req.session.user })
        }else{
            res.render('user/wishlist', { title: "Wishlist", products: [] , user: req.session.user })
        }
    }catch(error){
        console.log(`Error while render wishlist page ${error}`)
        res.status(400)
    }
}


// ---------------------------------Add wishlist-------------------------------

const addWishlist = async (req, res) => {
    try {
        const productID = req.params.id;
        const userID = req.session.user;

        const Product = await productSchema.findById(productID);

        if (!Product) {
            return res.status(404).json({ error: "Product not found" });
        }
        const wishlist = await wishlistSchema.findOne({ userID }).populate('products.productID');
        if (wishlist) {
            const productExists = wishlist.products.some((item) => item.productID.id === productID);

            if (productExists) {
                return res.status(400).json({ error: "Product already in wishlist" });
            } else {
                wishlist.products.push({ productID: Product._id });
                await wishlist.save();
                return res.status(200).json({ success: "Product added to wishlist" });
            }
        } else {
            const newWishlist = new wishlistSchema({
                userID,
                products: [{ productID: Product._id }]
            });
            await newWishlist.save();
            return res.status(200).json({ success: "Product added to wishlist" });
        }
    } catch (err) {
        console.error(`Error adding product to wishlist: ${err}`);
        return res.status(500).json({ message: "Error adding product to wishlist" });
    }
};


// --------------------------------- Delete wishlist-------------------------------

const deleteWishlist = async (req, res) => {
    const userId = req.session.user;
    const itemId = req.params.id;
    if (!userId) {
        return res.status(401).json({ success: false, message: 'User not found. Please login again.' });
    }
    if (!itemId || !ObjectId.isValid(itemId)) {
        return res.status(400).json({ success: false, message: 'Invalid item.' });
    }
    try {
        const wish = await wishlistSchema.findOne({ userID: userId });
        if (wish) {
            wish.products.pull({ productID: new ObjectId(itemId) });
            await wish.save();
            return res.json({ success: true, message: 'Item removed from wishlist.' });
        } else {
            return res.status(404).json({ success: false, message: 'Wishlist not found.' });
        }
    } catch (err) {
        console.error(`Error in removing the item from wishlist: ${err}`);
        return res.status(500).json({ success: false, message: 'Something went wrong. Please try again later.' });
    }
};


// ------------------------------ count of cart and wishlist -----------------------------

const getCounts = async (req, res) => {
    try {
        if (req.session.user) {
            const userId = req.session.user;

            const cart = await cartSchema.findOne({ userId }).select('items').lean().exec();
            const wishlist = await wishlistSchema.findOne({ userID: userId }).select('products').lean().exec();

            const cartItemsCount = cart && cart.items ? cart.items.length : 0;
            const wishlistItemsCount = wishlist && wishlist.products ? wishlist.products.length : 0;

            return res.json({ cartItemsCount, wishlistItemsCount });
        } else {
            return res.json({ cartItemsCount: 0, wishlistItemsCount: 0 });
        }
    } catch (error) {
        console.error('Error fetching counts:', error);
        return res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
};


module.exports = { wishlistpage , addWishlist , deleteWishlist , getCounts }