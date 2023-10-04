#ifndef MATRIX_H
#define MATRIX_H

#include "pugixml.hpp"

class Matrix {
    private:
        pugi::xml_node root;
    public:
        Matrix(pugi::xml_node& matrixNode);
        ~Matrix();
        Matrix(const Matrix& matrix);
        double getA();
        void setA(double a);
        double getB();
        void setB(double b);
        double getC();
        void setC(double c);
        double getD();
        void setD(double d);
        double getTx();
        void setTx(double tx);
        double getTy();
        void setTy(double ty);
};

#endif // MATRIX_H