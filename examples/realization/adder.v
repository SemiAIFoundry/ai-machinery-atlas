// Four-bit unsigned addition with an explicitly preserved fifth carry bit.
module adder4(input [3:0] a, b, output [4:0] sum);
  wire [4:0] carry;
  assign carry[0] = 1'b0;
  genvar i;
  generate for (i=0; i<4; i=i+1) begin: bit_slice
    assign sum[i] = a[i] ^ b[i] ^ carry[i];
    assign carry[i+1] = (a[i] & b[i]) | ((a[i] ^ b[i]) & carry[i]);
  end endgenerate
  assign sum[4] = carry[4];
endmodule

// At rising edge n, q captures the sum of inputs sampled at edge n-1.
// Power-on state is unspecified; the testbench discards pipeline fill.
module atlas_adder(input clk, input [3:0] a, b, output reg [4:0] q);
  reg [3:0] a_sampled, b_sampled;
  wire [4:0] sum;
  adder4 arithmetic(a_sampled, b_sampled, sum);
  always @(posedge clk) begin
    a_sampled <= a;
    b_sampled <= b;
    q <= sum;
  end
endmodule

module adder_contract(input [3:0] a, b, output ok);
  wire [4:0] sum;
  adder4 implementation(a,b,sum);
  assign ok = sum == ({1'b0,a} + {1'b0,b});
endmodule
