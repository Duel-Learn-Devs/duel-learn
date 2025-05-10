import Paymongo from 'paymongo';
import dotenv from 'dotenv';
import { pool } from '../config/db.js'; // Import your database connection
import axios from 'axios';

dotenv.config();

// Initialize the PayMongo client correctly
const paymongoClient = new Paymongo(process.env.PAYMONGO_SECRET_KEY);

const PaymentController = {
    createPayment: async (req, res) => {
        try {
            const { firebase_uid, username, email, plan } = req.body;

            // Determine amount based on subscription plan
            let amount = 0;
            let planName = '';
            let expiryDate = null;
            const now = new Date();

            switch (plan) {
                case 'monthly':
                    amount = 109;
                    planName = 'MONTHLY PLAN';
                    // Set expiry to 1 month from now
                    expiryDate = new Date(now);
                    expiryDate.setMonth(expiryDate.getMonth() + 1);
                    break;
                case 'annual':
                    amount = 1099;
                    planName = 'ANNUAL PLAN';
                    // Set expiry to 1 year from now
                    expiryDate = new Date(now);
                    expiryDate.setFullYear(expiryDate.getFullYear() + 1);
                    break;
                case 'free':
                    amount = 0;
                    planName = 'FREE PLAN';
                    // Set expiry to never or some default period
                    expiryDate = null;
                    break;
                default:
                    return res.status(400).json({ error: 'Invalid subscription plan' });
            }

            // If it's a free plan, just insert the record and return success
            if (amount === 0) {
                // Insert record into user_payment table for free plan
                await pool.query(
                    'INSERT INTO user_payment (firebase_uid, username, amount, plan, payment_method, status, created_at, paid_at, expires_at) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW(), NULL)',
                    [firebase_uid, username, amount, planName, 'free', 'active']
                );

                return res.status(200).json({
                    success: true,
                    message: 'Free plan selected, no payment required',
                    plan: planName
                });
            }

            if (amount === 109 || amount === 1099) {
                // Insert record into user_payment table for free plan
                await pool.query(
                    'INSERT INTO user_payment (firebase_uid, username, amount, plan, payment_method, status, created_at, paid_at, expires_at) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW(), NULL)',
                    [firebase_uid, username, amount, planName, 'premium', 'active']
                );

                try {
                    const [userResult] = await pool.query(
                        'UPDATE users SET account_type = ? ,account_type_plan = ? WHERE firebase_uid = ?',
                        ['premium', planName, firebase_uid]
                    );
                    const [userInfoResult] = await pool.query(
                        'UPDATE user_info SET account_type = ?, account_type_plan = ?, exp = exp + 1000, mana = ? , coins = coins + 500, tech_pass = tech_pass + 5 WHERE firebase_uid = ?',
                        ['premium', planName, 200, firebase_uid]
                    );

                    const [userItemsResult] = await pool.query(
                        'UPDATE user_items SET quantity = quantity + 5 WHERE firebase_uid = ? AND item_code = ?',
                        [firebase_uid, 'ITEM002TP']
                    );


                } catch (error) {
                    console.error('Error updating account type:', error);
                }

                console.log(`Premium plan activated for user ${firebase_uid}`);

                return res.status(200).json({
                    success: true,
                    message: 'Premium plan selected, no payment required',
                    plan: planName
                });
            }

            // For paid plans, create a payment record with 'pending' status
            const [paymentResult] = await pool.query(
                'INSERT INTO user_payment (firebase_uid, username, amount, plan, payment_method, status, created_at, expires_at) VALUES (?, ?, ?, ?, ?, ?, NOW(), ?)',
                [firebase_uid, username, amount, planName, 'paymongo', 'pending', expiryDate ? expiryDate : null]
            );

            const paymentId = paymentResult.insertId;

            // Create a payment link using PayMongo
            const paymentLinkResponse = await paymongoClient.links.create({
                data: {
                    attributes: {
                        amount: amount * 100, // Amount in cents
                        description: `Duel Learn ${planName}`,
                        remarks: JSON.stringify({
                            payment_id: paymentId,
                            firebase_uid,
                            username,
                            email,
                            plan: planName
                        })
                    }
                }
            });

            return res.status(200).json({
                success: true,
                payment_url: paymentLinkResponse.data.attributes.checkout_url,
                amount: amount,
                plan: planName
            });

        } catch (error) {
            console.error('Payment error:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to process payment',
                message: error.message
            });
        }
    },

    createCheckoutSession: async (req, res) => {
        try {
            const { firebase_uid, username, email, plan } = req.body;

            // Determine amount based on subscription plan
            let amount = 0;
            let planName = '';
            let expiryDate = null;
            const now = new Date();

            switch (plan) {
                case 'monthly':
                    amount = 109;
                    planName = 'MONTHLY PLAN';
                    expiryDate = new Date(now);
                    expiryDate.setMonth(expiryDate.getMonth() + 1);
                    break;
                case 'annual':
                    amount = 1099;
                    planName = 'ANNUAL PLAN';
                    expiryDate = new Date(now);
                    expiryDate.setFullYear(expiryDate.getFullYear() + 1);
                    break;
                default:
                    return res.status(400).json({ error: 'Invalid subscription plan' });
            }

            // For paid plans, create a payment record with 'pending' status
            const [paymentResult] = await pool.query(
                'INSERT INTO user_payment (firebase_uid, username, amount, plan, payment_method, status, created_at, expires_at) VALUES (?, ?, ?, ?, ?, ?, NOW(), ?)',
                [firebase_uid, username, amount, planName, 'paymongo', 'pending', expiryDate ? expiryDate : null]
            );

            const paymentId = paymentResult.insertId;

            // Create a checkout session using PayMongo API
            const checkoutSession = await axios.post(
                'https://api.paymongo.com/v1/checkout_sessions',
                {
                    data: {
                        attributes: {
                            line_items: [{
                                name: `Duel Learn ${planName}`,
                                amount: amount * 100, // Amount in cents
                                currency: 'PHP',
                                quantity: 1
                            }],
                            payment_method_types: ['card', 'gcash', 'grab_pay', 'paymaya'],
                            success_url: `${process.env.FRONTEND_URL}/dashboard/payment-success?payment_id=${paymentId}`,
                            cancel_url: `${process.env.FRONTEND_URL}/dashboard/buy-premium-account`,
                            description: `Duel Learn ${planName}`,
                            billing: {
                                email: email,
                                name: username
                            },
                            metadata: {
                                payment_id: paymentId.toString(),
                                firebase_uid,
                                username,
                                plan: planName
                            }
                        }
                    }
                },
                {
                    headers: {
                        'Authorization': `Basic ${Buffer.from(process.env.PAYMONGO_SECRET_KEY + ':').toString('base64')}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            return res.status(200).json({
                success: true,
                checkout_url: checkoutSession.data.data.attributes.checkout_url,
                amount: amount,
                plan: planName
            });

        } catch (error) {
            console.error('Checkout session error:', error.response?.data || error.message);
            return res.status(500).json({
                success: false,
                error: 'Failed to create checkout session',
                message: error.message
            });
        }
    },

    verifyPayment: async (req, res) => {
        try {
            const { paymentIntentId } = req.params;

            // Retrieve payment using the paymentIntentId
            const payment = await paymongoClient.payments.retrieve(paymentIntentId);

            if (payment.data.attributes.status === 'paid') {
                // Get the payment link id to fetch additional details
                const linkId = payment.data.attributes.source.id;
                const paymentLink = await paymongoClient.links.retrieve(linkId);

                // Extract metadata from remarks
                const remarks = JSON.parse(paymentLink.data.attributes.remarks || '{}');
                const planName = remarks.plan;
                const amount = payment.data.attributes.amount / 100;
                const { firebase_uid } = remarks;

                // Update user subscription if firebase_uid is available
                if (firebase_uid && planName) {
                    await updateUserSubscription(firebase_uid, planName);
                }

                return res.status(200).json({
                    success: true,
                    message: 'Payment verified',
                    planDetails: {
                        planName,
                        amount
                    }
                });
            } else {
                return res.status(400).json({
                    success: false,
                    message: 'Payment has not been completed'
                });
            }
        } catch (error) {
            console.error('Payment verification error:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to verify payment',
                message: error.message
            });
        }
    },

    // Enhanced paymongoWebhook to update user status
    paymongoWebhook: async (req, res) => {
        try {
            console.log('======== PAYMONGO WEBHOOK RECEIVED ========');
            console.log('Event:', JSON.stringify(req.body, null, 2));

            const event = req.body;
            if (!event || !event.data || !event.data.attributes) {
                return res.status(200).json({ received: true, error: 'Invalid event structure' });
            }

            const eventType = event.data.attributes.type;
            const resourceData = event.data.attributes.data;

            if (eventType === 'checkout.session.completed') {
                // Extract metadata from the checkout session
                const metadata = resourceData.attributes.metadata || {};
                const { payment_id, firebase_uid } = metadata;

                if (payment_id && firebase_uid) {
                    // Update the payment status to 'active'
                    await pool.query(
                        'UPDATE user_payment SET status = ?, paid_at = NOW() WHERE id = ?',
                        ['active', payment_id]
                    );

                    // Get the plan details
                    const [paymentRows] = await pool.query(
                        'SELECT * FROM user_payment WHERE id = ?',
                        [payment_id]
                    );

                    if (paymentRows.length > 0) {
                        const paymentDetails = paymentRows[0];

                        // Update user subscription status
                        await updateUserSubscription(firebase_uid, paymentDetails.plan);

                        console.log(`Subscription activated for user ${firebase_uid}, plan: ${paymentDetails.plan}`);
                    }
                }
            }

            return res.status(200).json({ received: true });
        } catch (error) {
            console.error('Webhook error:', error);
            return res.status(200).json({ received: true, error: error.message });
        }
    },

    verifyPaymentById: async (req, res) => {
        try {
            const { paymentId } = req.params;

            // Get payment details from your database
            const [rows] = await pool.query(
                'SELECT * FROM user_payment WHERE id = ?',
                [paymentId]
            );

            if (rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Payment not found'
                });
            }

            const payment = rows[0];

            // If payment is pending, update it to active and update user account type
            if (payment.status === 'pending') {
                await pool.query(
                    'UPDATE user_payment SET status = ?, paid_at = NOW() WHERE id = ?',
                    ['active', paymentId]
                );

                await pool.query(
                    'UPDATE users SET account_type = ?, account_type_plan = ? WHERE firebase_uid = ?',
                    ['premium', payment.plan, payment.firebase_uid]
                );

                await pool.query(
                    'UPDATE user_info SET account_type = ?, account_type_plan = ?, exp = exp + 1000, mana = ? , coins = coins + 500, tech_pass = tech_pass + 5 WHERE firebase_uid = ?',
                    ['premium', payment.plan, 200, payment.firebase_uid]
                );

                await pool.query(
                    'UPDATE user_items SET quantity = quantity + 5 WHERE firebase_uid = ? AND item_code = ?',
                    [payment.firebase_uid, 'ITEM002TP']
                );
            }

            return res.status(200).json({
                success: true,
                planDetails: {
                    planName: payment.plan,
                    amount: payment.amount
                }
            });
        } catch (error) {
            console.error('Payment verification error:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to verify payment',
                message: error.message
            });
        }
    },

    getUserSubscription: async (req, res) => {
        try {
            const { firebase_uid } = req.params;

            // Get the user's latest active payment
            const [rows] = await pool.query(
                'SELECT * FROM user_payment WHERE firebase_uid = ? AND status = ? ORDER BY created_at DESC LIMIT 1',
                [firebase_uid, 'active']
            );

            if (rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'No active subscription found'
                });
            }

            const payment = rows[0];

            return res.status(200).json({
                success: true,
                planDetails: {
                    planName: payment.plan,
                    amount: payment.amount,
                    expiresAt: payment.expires_at
                }
            });
        } catch (error) {
            console.error('Get user subscription error:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to get subscription details',
                message: error.message
            });
        }
    },

    cancelSubscription: async (req, res) => {
        try {
            const { firebase_uid } = req.body;

            // Cancel the user's subscription by updating the status to 'cancelled'
            await pool.query(
                'UPDATE user_payment SET status = ? WHERE firebase_uid = ? AND status = ?',
                ['cancelled', firebase_uid, 'active']
            );

            await pool.query(
                'UPDATE users SET account_type = ?, account_type_plan = ? WHERE firebase_uid = ?',
                ['free', 'free', firebase_uid]
            );
            await pool.query(
                'UPDATE user_info SET account_type = ?, account_type_plan = ? WHERE firebase_uid = ?',
                ['free', 'free', firebase_uid]
            );

            return res.status(200).json({
                success: true,
                message: 'Subscription cancelled successfully'
            });
        } catch (error) {
            console.error('Cancel subscription error:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to cancel subscription',
                message: error.message
            });
        }
    }
};

export default PaymentController;