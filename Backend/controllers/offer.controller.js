import Offer from "../models/offer.model.js";

// CREATE OFFER (Admin)
export const createOffer = async (req, res) => {
  try {
    const offer = new Offer(req.body);
    await offer.save();
    res.status(201).json({ success: true, message: "Offer created successfully", offer });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: "Offer code already exists" });
    }
    res.status(500).json({ success: false, message: "Failed to create offer", error: error.message });
  }
};

// GET ALL OFFERS (Admin or public, maybe filter by active)
export const getAllOffers = async (req, res) => {
  try {
    const filter = req.query.activeOnly === "true" ? { isActive: true, expiryDate: { $gt: new Date() } } : {};
    const offers = await Offer.find(filter).sort({ createdAt: -1 });
    res.status(200).json({ success: true, offers });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch offers", error: error.message });
  }
};

// UPDATE OFFER (Admin)
export const updateOffer = async (req, res) => {
  try {
    const { id } = req.params;
    const offer = await Offer.findByIdAndUpdate(id, req.body, { new: true });
    if (!offer) {
      return res.status(404).json({ success: false, message: "Offer not found" });
    }
    res.status(200).json({ success: true, message: "Offer updated successfully", offer });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update offer", error: error.message });
  }
};

// DELETE OFFER (Admin)
export const deleteOffer = async (req, res) => {
  try {
    const { id } = req.params;
    const offer = await Offer.findByIdAndDelete(id);
    if (!offer) {
      return res.status(404).json({ success: false, message: "Offer not found" });
    }
    res.status(200).json({ success: true, message: "Offer deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to delete offer", error: error.message });
  }
};

// VALIDATE & APPLY OFFER (User checkout)
export const validateAndApplyOffer = async (req, res) => {
  try {
    const { code, cartValue } = req.body;
    
    // Check if code exists
    const offer = await Offer.findOne({ code: code.toUpperCase() });
    if (!offer) {
      return res.status(404).json({ success: false, message: "Invalid promo code" });
    }

    // Check if active and not expired
    if (!offer.isActive || new Date(offer.expiryDate) < new Date()) {
      return res.status(400).json({ success: false, message: "This promo code is expired or inactive" });
    }

    // Check min order value
    if (cartValue < offer.minOrderValue) {
      const difference = offer.minOrderValue - cartValue;
      return res.status(400).json({
        success: false,
        message: `Add ₹${difference} more to apply this offer`,
        difference
      });
    }

    // Check usage limits (TODO: Implement actual user usage check with Orders)
    if (offer.usageLimit !== null && offer.usageLimit <= 0) {
       return res.status(400).json({ success: false, message: "This offer's usage limit has been reached" });
    }

    // Calculate discount
    let discountAmount = 0;
    if (offer.discountType === "FLAT") {
      discountAmount = offer.discountValue;
    } else if (offer.discountType === "PERCENTAGE") {
      discountAmount = (cartValue * offer.discountValue) / 100;
      if (offer.maxDiscountAmount && discountAmount > offer.maxDiscountAmount) {
        discountAmount = offer.maxDiscountAmount;
      }
    }

    // Discount cannot be more than cart value
    if (discountAmount > cartValue) {
        discountAmount = cartValue;
    }

    res.status(200).json({
      success: true,
      message: "Offer applied successfully",
      discountAmount,
      offerId: offer._id,
      offerTitle: offer.title
    });

  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to validate offer", error: error.message });
  }
};

// GET SUGGESTIONS for cart
export const getOfferSuggestions = async (req, res) => {
  try {
    const { cartValue } = req.query;
    if (!cartValue) return res.status(400).json({ success: false, message: "Cart value required" });
    
    const value = parseFloat(cartValue);
    
    const offers = await Offer.find({ isActive: true, expiryDate: { $gt: new Date() } });
    
    const suggestions = offers.map(offer => {
      if (value >= offer.minOrderValue) {
        return {
          code: offer.code,
          message: `Apply code ${offer.code} to get ${offer.discountType === 'FLAT' ? '₹' + offer.discountValue : offer.discountValue + '%'} off`,
          eligible: true
        };
      } else {
        const diff = offer.minOrderValue - value;
        return {
          code: offer.code,
          message: `Add ₹${diff} more to apply code ${offer.code} and get ${offer.discountType === 'FLAT' ? '₹' + offer.discountValue : offer.discountValue + '%'} off`,
          eligible: false,
          difference: diff
        };
      }
    });

    res.status(200).json({ success: true, suggestions });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to get suggestions", error: error.message });
  }
};
