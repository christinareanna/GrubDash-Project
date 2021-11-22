const path = require("path");
//dishes can't be deleted
// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// list all of the dishes
function list(req, res, next) {
    res.status(200).json({ data: dishes });
}

// reads one dish
function read(req, res, next) {
    res.status(200).json({ data: res.locals.dish });
}

function create(req, res) {
    const {
        data: { name, description, price, image_url },
    } = req.body;

    const newDish = {
        id: nextId(),
        name,
        description,
        price,
        image_url,
    };

    dishes.push(newDish);
    res.status(201).json({ data: newDish });
}

// dishes - id, name, description, price, image_url
function update(req, res, next) {
    const {
        data: { id, name, description, price, image_url },
    } = req.body;

    // if there is no id, keep it the same, else update it
    if (!id) {
        res.locals.dish.id = res.locals.dish.id;
    } else {
        res.locals.dish.id = id;
    }

    res.locals.dish.name = name;
    res.locals.dish.description = description;
    res.locals.dish.price = price;
    res.locals.dish.image_url = image_url;

    res.status(200).json({ data: res.locals.dish });
}

// Middleware function checks if dish exists
function dishExists(req, res, next) {
    const { dishId } = req.params;
    const foundDish = dishes.find((dish) => dish.id === dishId);
    if (foundDish) {
        res.locals.dish = foundDish;
        return next();
    } else {
    next({
        status: 404,
        message: `Dish does not exist: ${dishId}`,
    });
}
}


// Does the dish have neccessary info

function isValid(req, res, next) {
    const { data: { name, description, price, image_url } } = req.body;

    if (!name) {
        next({
            status: 400,
            message: "Dish must include a name",
        });
    }

    if (!description) {
        next({
            status: 400,
            message: "Dish must include a description",
        });
    }

    if (!price) {
        next({
            status: 400,
            message: "Dish must include a price",
        });
    } else if
        (price <= 0 || typeof price != 'number') {
        next({
            status: 400,
            message: "Dish must have a price that is an integer greater than 0",
        });
    }

    if (!image_url) {
        next({
            status: 400,
            message: "Dish must include an image_url",
        });
    }
    next();
}

function hasValidId(req, res, next) {
    const {
        data: { id },
    } = req.body;

    if (id && id !== res.locals.dish.id) {
        return next({
            status: 400,
            message: `Dish id does not match route id. Dish: ${id}, Route: ${res.locals.dish.id}`,
        });
    }

    next();
}


module.exports = {
    list,
    read: [dishExists, read],
    create: [isValid, create],
    update: [dishExists, isValid, hasValidId, update],
};
