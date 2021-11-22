const path = require("path");
const orders = require(path.resolve("src/data/orders-data"));
const nextId = require("../utils/nextId");

// list all orders
function list(req, res) {
    res.status(200).json({ data: orders });
}

// read one order
function read(req, res) {
    res.status(200).json({ data: res.locals.order });
}

// create a new order with necessary info
function create(req, res) {
    const {
        data: { deliverTo, mobileNumber, status, dishes },
    } = req.body;

    const newOrder = {
        id: nextId(),
        deliverTo,
        mobileNumber,
        status,
        dishes,
    };

    orders.push(newOrder); // move new order to orders
    res.status(201).json({ data: newOrder });
}

// update the order with specific info
function update(req, res, next) {
    const { data: { deliverTo, mobileNumber, status, dishes } } = req.body
    const order = res.locals.order
    const updatedOrder = {
        id: order.id,
        deliverTo,
        mobileNumber,
        status,
        dishes
    }
    res.json({ data: updatedOrder })
}

// delete order, can only delete if it's pending
function destroy(req, res, next) {
    if (res.locals.order.status !== "pending") {
        return next({
            status: 400,
            message: "Can't delete an order unless it's pending!",
        });
    }
    const index = orders.findIndex((order) => order.id === res.locals.order.id);
    if (index > -1) { // finds index 
        orders.splice(index, 1);
    }
    res.sendStatus(204);
}

// Validate orders
function isValid(req, res, next) {
    const { orderId } = req.params;
    const foundOrder = orders.find((order) => order.id === orderId);

    if (foundOrder) {
        res.locals.order = foundOrder;
        return next();
    } else {
        next({
            status: 404,
            message: `Order id could not be found: ${orderId}`,
        });
    }
}

function hasValidInfo(req, res, next) {
    const {
        data: { deliverTo, mobileNumber, dishes },
    } = req.body;

    if (!deliverTo) {
        next({
            status: 400,
            message: "Order must include a deliverTo",
        });
    }

    if (!mobileNumber) {
        next({
            status: 400,
            message: "Order must include a mobileNumber",
        });
    }

    if (!dishes) {
        next({
            status: 400,
            message: "Order must include a dish",
        });
    }

    if (dishes.length === 0 || !Array.isArray(dishes)) {
        next({
            status: 400,
            message: "Order must include at least one dish",
        });
    }

    // error validation

    let message = "";
    dishes.forEach((dish, index) => {
        if (dish.quantity <= 0 || typeof dish.quantity !== "number") {
            message = `Dish ${index} must have a quantity that is an integer greater than 0`;
        }
    });
    if (message) {
        next({
            status: 400,
            message: `${message}`,
        });
    } else {
        next();
    }
}

function hasValidStatus(req, res, next) {
    const { data: { status } } = req.body;
        if(!status ||
        (status !== 'pending' && 
        status !== 'preparing' && 
        status !== 'out-for-delivery' &&
        status !== "delivered")
        ) {
     next({ status: 400, message: `Order must have a status of pending, preparing, out-for-delivery, delivered` })
    }

    if (status === "delivered") {
        return next({
            status: 400,
            message: 'A delivered order cannot be changed'
        })
    }
    next()
};




function hasValidId(req, res, next) {
    const {
        data: { id },
    } = req.body;

    if (id && id !== res.locals.order.id) {
        return next({
            status: 400,
            message: `Order id does not match route id. Order: ${id}, Route: ${res.locals.order.id}`,
        });
    }

    next();
}

module.exports = {
    list,
    read: [isValid, read],
    create: [hasValidInfo, create],
    update: [
        isValid,
        hasValidInfo,
        hasValidId,
        hasValidStatus,
        update,
    ],
    delete: [isValid, destroy],
};