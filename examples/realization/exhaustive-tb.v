`timescale 1ns/1ps
module testbench;
  reg clk=0;
  reg [3:0] a=0,b=0;
  wire [4:0] q;
  integer av,bv,expected,checks=0;
  atlas_adder dut(clk,a,b,q);
  always #5 clk=~clk;
  initial begin
    for(av=0;av<16;av=av+1) begin
      for(bv=0;bv<16;bv=bv+1) begin
        @(negedge clk); a=av; b=bv;
        @(posedge clk); // Inputs sampled.
        @(posedge clk); #1; // Previous input sample has traversed the adder.
        expected=av+bv;
        if(q !== expected[4:0]) begin
          $display("FAIL a=%0d b=%0d got=%0d expected=%0d",av,bv,q,expected);
          $fatal(1,"Addition contract failed");
        end
        checks=checks+1;
      end
    end
    $display("PASS: %0d exhaustive input pairs; registered unsigned sum preserves the carry bit.",checks);
    $finish;
  end
endmodule
