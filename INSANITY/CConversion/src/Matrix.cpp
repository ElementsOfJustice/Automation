#include "../include/Matrix.h"
Matrix::Matrix(pugi::xml_node& matrixNode) {
    this->root = matrixNode;
}
Matrix::~Matrix() {
    
}
double Matrix::getA() {
    return this->root.attribute("a").as_double();
}
void Matrix::setA(double a) {
    this->root.attribute("a").set_value(a);
}
double Matrix::getB() {
    return this->root.attribute("b").as_double();
}
void Matrix::setB(double b) {
    this->root.attribute("b").set_value(b);
}
double Matrix::getC() {
    return this->root.attribute("c").as_double();
}
void Matrix::setC(double c) {
    this->root.attribute("c").set_value(c);
}
double Matrix::getD() {
    return this->root.attribute("d").as_double();
}
void Matrix::setD(double d) {
    this->root.attribute("d").set_value(d);
}
double Matrix::getTx() {
    return this->root.attribute("tx").as_double();
}
void Matrix::setTx(double tx) {
    this->root.attribute("tx").set_value(tx);
}
double Matrix::getTy() {
    return this->root.attribute("ty").as_double();
}
void Matrix::setTy(double ty) {
    this->root.attribute("ty").set_value(ty);
}