use soroban_sdk::{contractevent, Address, Env};

#[contractevent(topics = ["pt_buy"], data_format = "vec")]
#[derive(Clone, Debug)]
pub struct BuyEvent {
    pub payer: Address,
    pub beneficiary: Address,
    pub amount: i128,
    pub usdc: Address,
}

pub fn emit_buy(env: &Env, event: BuyEvent) {
    event.publish(env);
}

#[contractevent(topics = ["caps_updated"], data_format = "vec")]
#[derive(Clone, Debug)]
pub struct CapsUpdatedEvent {
    pub admin: Address,
    pub new_hard_cap: i128,
    pub new_max_per_investor: i128,
}

pub fn emit_caps_updated(env: &Env, event: CapsUpdatedEvent) {
    event.publish(env);
}
