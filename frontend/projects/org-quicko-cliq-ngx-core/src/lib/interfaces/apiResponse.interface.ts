export interface ApiResponse<T> {
	code: number;
	data?: T;
	timestamp: number;
	transaction_id: string;
	message?: string;
}
