def apply_spam_penalty(final_score, credit_score, hybrid_score, threshold=0.7):
    """
    Reduces final_score and credit_score if hybrid_score indicates spam.
    full error checking included.
    """
    try:
        if not isinstance(final_score, (int,float)):
            raise TypeError("final_score must be numeric")
        if not isinstance(credit_score, (int,float)):
            raise TypeError("credit_score must be numeric")
        if not isinstance(hybrid_score, (int,float)):
            raise TypeError("hybrid_score must be numeric")
        
        if hybrid_score > threshold:
            penalty = 100
            final_score = max(0, final_score - penalty)
            credit_score = max(0, credit_score - int(penalty/2))
        
        return final_score, credit_score
    except Exception as e:
        print(f"Error applying spam penalty: {e}")
        return final_score, credit_score
